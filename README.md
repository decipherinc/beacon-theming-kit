#Welcome to the playground.
  Getting started...
    • theme.less is your dojo, that file will constitue the theme. Comments are provided to guide you along the way.
    • Use the dev environment, it's crazy easy to set up and will have you off and running in seconds.
    • If you've never written in LESS, don't worry, it's the same thing as css with some extra abilities. I break down what you need to know at the bottom of this document. 

  When you're done creating your theme styles...
    • Rename the theme.less file to whatever your theme is called. 
    • Apply it to a survey by uploading it via the Beacon theme editor and choosing it.

#Setting Up the Development Environment
  Initial Install:
    You change something in themes.less, save, your styles are compiled and the browser refreshes. That's what we're going to set up in a couple easy steps. It will run on a local server, allowing all your online dependencies to be pulled down (jquery, font-awesome, any google fonts).

    1. Open up "Terminal"
          or "Command Prompt" on windows (we'll call it "terminal" from here on). 

    2. If you don't have node.js installed
          install it from  http://nodejs.org/  look for the big obvious 'Install' button.

    3. If you don't have grunt.js installed
          install it by entering "npm install -g grunt-cli" (don't copy the quotes) into the terminal. If you're on a mac and it looks like it didn't work, try "sudo npm install -g grunt-cli", enter your computer's password when promted.

    4. CD into the 'theme_boilerplate' folder. 
          Easiest way is to just type "cd " (with the space), then drag the folder onto the termina, it will type the folder path for you then hit enter.

    5. Type "npm install", hit enter.
          This will create a 'node_modules' folder and bring down the stuff grunt needs for running it's magic. You only need to do this once, unless you delete the node_modules folder somehow, then you'd run this again.

    6. Type "grunt server" and hit enter. 
          If the page fails to load, that's because it opened the browser faster than the server could be created, just hit refresh and it will be running. The tasks will run until you close the terminal or hit 'CNRL + c'.

    Now any time you make a change to theme.less, the less will be compiled into css and the browser will refresh automatically. If you save and don't see a change, take a peek at the terminal, it's probably because you have a mistake in your less, when it's fixed and you save, it will compile and reload properly.


  Firing Up:
    1. cd into the theme_boilerplate folder.
    2. grunt server

#What you need to know to start writing LESS CSS
You can write straight CSS in a LESS file and it will be just fine. 
Less just has some tools that make your life way easyer, here are 3 that we leverage:

Nesting:
  Instead of writing plain CSS...
      .logo { 
        background-color: red; 
      }

      .logo .text { 
        background-color: white; 
      }

      .logo .text.cta-green { 
        background-color: green; 
      }

      a {
        color: blue;
      }

      a:hover, a:focus {
        color: light-blue;
      }

  You can use LESS nesting to get the exact same outcome in a nicer way...
      .logo {
        background-color: red;
        .text {
          background-color: white;
          &.cta-green {
            background-color: green;
          }
        }
      }

      a {
        color: blue;
        &:hover, &:focus {
          background-color: green;
        }
      }

    The '&' repeats the parent, so in the '&.cta-green' example, it's like saying .text.cta-green, with no & it just layers it, so '.text' inside of '.logo' becomes '.logo .text' with a space.
    Don't go too deep with the nesting though, keeping the styles flat makes it easyer for our users to override them if they need (its easier to overide '.instruction-text' than '.survey .question .instruction-text'). The example where hover and focus are nested in the 'a' is a great use case. Or for styles that need to all have the same prefixing parent style.

  You can nest media queries and keep your mobile first styles right next to the desktop override styles taking place in the media query...
      .logo {
        font-size: 1.25em;
        @media (min-width: 768px) {
          font-size: 2em;
        }
      }

    will compile to become...

      .logo {
        font-size: 1.25em;
      }

      @media (min-width: 768px) {
        .logo {
          font-size: 2em;
        }
      }


Variables:
  Variables are super useful for themes in particular because they allow us to provide easy customization. The theme editor actually scans the theme file for variables and displays them as editable components.

  Set up a LESS variable like this...
      @variable-name: property;

  Once it's set up, the variable can be used elsewhere, like this...
      @bg-color: #ffffff;

      body {
        background-color: @bg-color;
      }

    Which will create...
      body {
        background-color: #ffffff;
      }

    Super useful when applying the same color or value to lots of different selectors, when you need to change it, you only have to do so in one place. It also helps you keep color variances down.


Functions:
  LESS has some cool functions available. Some of the color functions are super useful for creating modifications of a specific color, like this...
    @clr-2: #000;
    @opaic-black: fadeOut(@black, 50); // reduce opacity of @clr-t (black) by 50%
    @grey: lighten(@black, 80); // lightening @black by 80 yeilds #cccccc
    @darker-grey: darken(@grey, 50); darkening @grey by 50 yeilds #1a1a1a

  Learn more about LESS functions here: http://lesscss.org/functions/
