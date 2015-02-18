#Welcome to the playground.
Getting started...
* theme.less is your dojo, that file will constitue the theme. Comments are provided to guide you along the way.
* Use the dev environment, it's easy to set up and will have you off and running in no time.
* If you've never written in LESS, don't worry, it's the same thing as css with some extra abilities. I break down what you need to know at the bottom of this document. 

When you're done creating your theme styles...
* Rename the theme.less file to whatever your theme is called. 
* For now, ask Daniel Rippstein how to get the theme file into the system properly.

#Setting Up the Development Environment

###Initial Install

You change something in themes.less, save, your styles are compiled and the browser refreshes automatically. That's what we're going to set up in a couple easy steps. It will run on a local server, allowing all your online dependencies to be pulled down (jquery, font-awesome, any google fonts).

1. Open up "Terminal" or "Command Prompt" on windows (we'll call it "terminal" from here on). 
2. If you don't have node.js installed, install it from  http://nodejs.org/  look for the big obvious 'Install' button.
3. If you don't have grunt.js installed, install it by entering `npm install -g grunt-cli` into the terminal. If you're on a mac and it looks like it didn't work, try `sudo npm install -g grunt-cli` to install as administrator, enter your computer's password when promted.
4. Download the theme kit from github and cd into the folder from the terminal. Easiest way is to just type `cd`, space, then drag the folder onto the termina, it will type the folder path for you then hit enter.
5. Type `npm install`, hit enter. This will create a 'node_modules' folder and download the stuff grunt needs for running it's magic. You only need to do this once, unless you delete the node_modules folder somehow, then you'd run this again.
6. Type `grunt server` and hit enter. You should see two processes fire up, one running a local server at `localhost:3000`, and one running "watch", which watches the theme.less file and compiles less + refreshes the browser every time you save. If you save and don't see a change, take a peek at the terminal, it's probably because you have a mistake in your less, when it's fixed and you save, it will compile and reload properly.

###Firing Up
1. Open terminal and `cd` into the theme_boilerplate folder.
2. Run `grunt server`

This will run a local server at `localhost:3000` and every time you save the theme.less file, it will compile the less into css and refresh the browser.