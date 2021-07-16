#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var gh_pages_1 = __importDefault(require("gh-pages"));
var shelljs_1 = __importDefault(require("shelljs"));
// Variables
var buildDir = 'build';
var commitMessage = 'Site update';
// Exit if there is any error
shelljs_1.default.set('-e');
// Publish to GitHub Pages
gh_pages_1.default.publish(buildDir, {
    message: commitMessage,
}, function (err) {
    if (err) {
        console.log(err);
        shelljs_1.default.exit(1);
    }
});
// Message when succesfully completed
console.log('done');
