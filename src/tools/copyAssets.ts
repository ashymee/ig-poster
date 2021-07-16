import shell from 'shelljs'

shell.cp('-R', 'src/public/*', 'build/')
shell.cp('-R', 'build/tools/ghPages.js', 'build/')
