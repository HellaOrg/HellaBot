# HellaBot

An Arknights Discord bot that provides information on operators, enemies, stages, and more! 

[Click here to invite the bot to a server (also available in DMs).](https://discord.com/application-directory/1277141603575922710)

> Note: the `spine` command is disabled because it's quite compute-intensive. If you'd like that functionality, feel free to run the bot for yourself :^)

A work-in-progress personal project. Game data is fetched from [HellaAPI](https://github.com/Awedtan/HellaAPI).

## Installation

To run the bot on your own machine or wherever else, follow the steps below.

1. Install [Node.js](https://nodejs.org/en)
2. Clone or download this repository
```sh
git clone https://github.com/Awedtan/HellaBot.git --depth=1
```
3. Install the project dependencies
```sh
cd HellaBot
npm install
```
4. In the project folder, rename `sample-config.json` to `config.json` and fill in the fields
```jsonc
{
    // required fields
    "token": "your_bot_token_here",
    "clientId": "your_application_id_here",

    // optional fields, delete these fields if not using them
    "apiUrl": "your_api_url_here", // default URL is https://awedtan.ca/api
    "disabled": { // you can add commands here and set to `true` to disable them
        "spine": false
    }
}
```
The project directory should now look something like this:
```sh
HellaBot/
├── config.json
├── node_modules/
├── package.json
├── package-lock.json
├── README.md
├── src/
└── tsconfig.json
```
5. Run the bot!
```sh
npm start
```

## Usage

HellaBot uses slash commands. To use a command, just type: `/[command]`

All command interactions are event-driven, so buttons and other interactables will never expire!

### Command List

| Command | Description                                                      |
|---------|------------------------------------------------------------------|
| cc      | Show information on a Contingency Contract stage or season       |
| ccb     | Show information on a CC Battleplan stage or season              |
| current | Show what's currently happening in the game                      |
| define  | Show definitions for in-game terms                               |
| deploy  | Show information on a deployable                                 |
| enemy   | Show an enemy's information and abilities                        |
| events  | Show a list of in-game events                                    |
| gacha   | Show a list of gacha banners and rate-ups                        |
| help    | Show help info on commands                                       |
| info    | Show an operator's stats, skills, modules, and more              |
| is2     | Show information on IS2: Phantom & Crimson Solitaire             |
| is3     | Show information on IS3: Mizuki & Caerula Arbor                  |
| is4     | Show information on IS4: Expeditioner's Jǫklumarkar              |
| is5     | Show information on IS5: Sarkaz's Furnaceside Fables             |
| item    | Show information on an item                                      |
| new     | Show newly updated game data                                     |
| ping    | Get bot network latency                                          |
| ra2     | Show information on RA2: Tales Within the Sand                   |
| recruit | Find recruitable operators from recruitment tags                 |
| spine   | Render and display spine animations                              |
| stage   | Show information on a stage                                      |

## Acknowledgements

[Kengxxiao/ArknightsGameData_YoStar](https://github.com/Kengxxiao/ArknightsGameData_YoStar) for providing the raw game data.

[Aceship/Arknight-Images](https://github.com/Aceship/Arknight-Images) for providing game images.

[Penguin Statistics](https://penguin-stats.io/) for providing item drop rates.

[MrJAwesome](https://www.youtube.com/@MrJAwesomeYT) for making videos on Discord.js that helped me get started on this project.
