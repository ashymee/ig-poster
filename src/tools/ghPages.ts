#!/usr/bin/env node
import ghpages from 'gh-pages'
import shell from 'shelljs'

// Variables
const buildDir = 'build'
const commitMessage = 'Site update'

// Exit if there is any error
shell.set('-e')

// Publish to GitHub Pages
ghpages.publish(
  buildDir,
  {
    message: commitMessage,
  },
  function (err) {
    if (err) {
      console.log(err)
      shell.exit(1)
    }
  }
)

// Message when succesfully completed
console.log('done')
