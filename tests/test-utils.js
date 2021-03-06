'use strict';

var fs = require('fs');
var path = require('path');

var nock = require('nock');

var config = require('../lib/config');

module.exports = {

    // The host for local Discord
    appHost: 'http://localhost:' + config.port,

    // Track hostname for GitHub
    githubHost: 'https://api.github.com',

    // Directory for fixtures
    fixturesDir: path.join(__dirname, 'fixtures/'),

    // Directory for recorded fixtures
    recordedFixturesDir: path.join(__dirname, 'fixtures/recorded/'),

    // Directory for non-recorded fixtures
    nonRecordedFixturesDir: path.join(__dirname, 'fixtures/non-recorded/'),

    // Builds a file path to a local test fixture JSON file
    getFileContents: function(directory, fixture) {
        var split = fixture.split('.');
        if (split.pop().toLowerCase() === 'json') {
            fixture = split.join('.');
        }

        return JSON.parse(fs.readFileSync(directory + '/' + fixture + '.json'));
    },

    // Utility to setup the nock and lock variables into place
    setupNock: function(url, item, requestType, payload, posts, done) {
        var completedPosts = 0;

        nock(this.githubHost).persist()[requestType](url).reply(function() {
            if (requestType === 'post') completedPosts++;

            if (completedPosts === posts) {
                done();
                nock.cleanAll(); // Cleanup so there's no interfering with other tests
            }

            return [200, payload];
        });
    },

    // Utility to setup all nocks for a manifest
    setupNocksForManifest: function(manifest, index, done) {
        var item;
        for (var url in manifest.urls) {
            if (manifest.urls.hasOwnProperty(url)) {

                item = manifest.urls[url];

                this.setupNock(
                    url,
                    item,
                    item.method.toLowerCase(),
                    this.getFileContents(this.recordedFixturesDir + index.toString(), item.file),
                    manifest.posts,
                    done
                );
            }
        }

    }
};
