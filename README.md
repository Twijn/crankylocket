# crankylocket
Commission work for Meiya's stream.

## Contents

- [Installation Information](#installation-information)
    - [Installing NPM & Node.js](#installing-npm--nodejs)
    - [Download this Repository](#download-this-repository)
    - [Configure Environment Variables](#configure-environment-variables)
    - [Install Dependencies](#install-dependencies)
- [Running the Program](#running-the-program)
- [Reaching Out](#reaching-out)

## Installation Information
<small>[Back to Contents](#contents)</small>

This program requires NPM and Node.js, and is built on packages such as Express, EJS, Discord.js, and Twurple. All of these must be installed prior to local use of the program. A Discord bot must also be created to manage roles in a server and a Twitch app must be configured in order to retrieve tokens to the Helix API, EventSub, and TMI. Additionally, git is preferred in order to download this repository, however a zip file can be downloaded from GitHub as well.

### Installing NPM & Node.js
[Back to Contents](#contents)

Installation of Node Version Manager (NVM) or Fast Node Manager (FNM) is recommended in order to properly manage Node.js versions. [NVM/FNM, NPM and Node.js can be downloaded and installed at this link.](https://nodejs.org/en/download/package-manager) The lastest v20 Node.js version should be installed using Powershell on windows or the Linux/MacOS Terminal.

### Download this Repository
<small>[Back to Contents](#contents)</small>

Download this repo by running the following command in a command prompt with Git installed. Ensure that you are located in a directory in which you would like to install the program using `ls` and `cd`.

```bash
git clone https://github.com/Twijn/crankylocket.git
```
Alternatively, a ZIP file can be downloaded by clicking "Code" above then Download as ZIP.

### Configure Environment Variables
<small>[Back to Contents](#contents)</small>

Once the repository has been downloaded and unpackaged (if downloaded as a ZIP), environment variables must be set up for the program to function. Create a `.env` file in the root of the repository that was created, and paste the following into that file:

```dotenv
MDB_URL=mongodb+srv://username:password@example.com/database?retryWrites=true&w=majority
# MongoDB Connection URL

DISCORD_TOKEN=(discord token)
# Discord Secret Token, retrieved from https://discord.com/developers/applications

TWITCH_CLIENT_ID=(twitch ID)
TWITCH_CLIENT_SECRET=(twitch secret)
# Twitch Client ID & Secret, retrieved from https://dev.twitch.tv/

EXPRESS_PORT=3393
EXPRESS_URI=http://localhost:3393/
EXPRESS_COOKIE_DOMAIN=localhost
# Express information, including the port to operate on and the base URI (used to send to the Twitch API)
# If the port is changed, the new redirect URI must be added to the Twitch app.
```
For the sake of this commission, a working .env file will be provided.

### Install Dependencies
<small>[Back to Contents](#contents)</small>

Next, dependencies need to be installed by NPM. Open Powershell or a terminal in the repo and run:

```bash
npm i
```
If the terminal says the command does not exist, ensure you are using Powershell if you are on Windows or refer back to [Installing NPM & Node.js](#installing-npm--nodejs).

## Running the Program
<small>[Back to Contents](#contents)</small>

After all above steps have been completed, the application may be started. Single-use operation can be achieved by running the program manually in Powershell or terminal using `node app`, or the application may be ran in the background on startup using software such as [PM2](https://pm2.keymetrics.io/). This software was built with PM2 in mind.

## Reaching Out
<small>[Back to Contents](#contents)</small>

Feel free to reach out to me on GitHub, Discord @ `twijn`, or email (twijn@twijn.net) if you have any questions or concerns!
