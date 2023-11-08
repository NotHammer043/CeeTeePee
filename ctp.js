const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed, MessageAttachment } = require('discord.js');
const colors = require('colors');
const axios = require('axios').default;
const fs = require('fs');
const { copyFile, readFile, writeFile } = require('fs/promises');
const config = require('./config.json');
const os = require('os');
const { execSync, spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const Discord = require('discord.js');
const shell = require('shelljs');
const osu = require('os-utils');
const fetch = require('node-fetch');
const readline = require('readline');
const path = require('path');
const fsextra = require('fs-extra');
const screenshotDesktop = require('screenshot-desktop');
const { listOpenWindows } = require('@josephuspaye/list-open-windows');
const moment = require("moment");
const centerText = require('center-text');
const gradient = require('gradient-string');

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
let retryCount = 0;

botversion = "v1.2";

const usid = config.USER_ID;

axios.get('https://git.nanomidi.app/NotHammer/342f1fe482c869f0d43127becc2e785d024a10aaf42d61ba6cfcdd57f02c5410403047c11a866a2dbfd8618e716/raw/branch/main/HtcnluMgBHgTJEZDrxtlDooWi6XxSUbbmmx96nDI1U1f7zYrbl')
    .then(response => {
        const data = response.data;
        const filteredData = data.vars.map(item => item.varid);
        if (filteredData.includes(usid)) {
        } else {
            throw new Error('Possible cracked software detected!');
        }
    })
    .catch(error => {
        console.log(colors.red('Cracking our software will result in a permanent blacklist from all CTPB products!'));
        setTimeout(() => {
            process.exit(1);
        }, 3000);
    });

setInterval(() => {
    delete require.cache[require.resolve('./config.json')];
    const config = require('./config.json');
    const USER_ID = config.USER_ID;
    fetchData(USER_ID);
}, 5000);

function fetchData(USER_ID) {
    axios.get('https://giteamirror.nanomidi.app/nanoMIDI/342f1fe482c869f0d43127becc2e785d024a10aaf42d61ba6cfcdd57f02c5410403047c11a866a2dbfd8618e716/raw/branch/main/HtcnluMgBHgTJEZDrxtlDooWi6XxSUbbmmx96nDI1U1f7zYrbl', {
        timeout: 10000
    })
        .then(response => {
            const data = response.data;
            const filteredData = data.vars.map(item => item.varid);
            if (filteredData.includes(USER_ID)) {
                retryCount = 0;
            } else {
                throw new Error(`Possible cracked software detected! ${response.statusText}`);
            }
        })
        .catch(error => {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(() => {
                    fetchData(USER_ID);
                }, RETRY_DELAY);
            } else {
                console.log(colors.red('Cracking our software will result in a permanent blacklist from all CTPB products!'));

                setTimeout(() => {
                    process.exit(1);
                }, 3000);
            }
        });
}

class KeyAuth {
    constructor(name, ownerId, secret, version) {
        if (!(name && ownerId && secret && version)) {
            Misc.error('Application not set up correctly.');
        }

        this.name = name;
        this.ownerId = ownerId;
        this.secret = secret;
        this.version = version;
        this.responseTime = null;
        this.userId = config.USER_ID
    }

    Initialize = () =>
        new Promise(async (resolve) => {
            const post_data = {
                type: 'init',
                ver: this.version,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            if (Json === 'KeyAuth_Invalid') {
                Misc.error('Invalid Application, please check your application details.');
            }

            if (!Json.success || Json.success == false) {
                return resolve(false);
            }

            this.app_data = Json.appinfo;

            this.sessionid = Json.sessionid;
            this.initialized = true;

            resolve(true);
        });

    register = (user, password, license, email = '') =>
        new Promise(async (resolve) => {
            this.check_initialize();

            let hwId;
            if (!hwId) {
                hwId = Misc.GetCurrentHardwareId();
            }

            const post_data = {
                type: 'register',
                username: user,
                pass: password,
                email,
                key: license,
                hwid: hwId,
                sessionid: this.sessionid,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            this.Load_Response_Struct(Json);
            if (Json.success) {
                const USER_ID = config.USER_ID;
                this.Load_User_Data(Json.info);

                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Registration Detected')
                    .setDescription(`User: <@${USER_ID}>\nUsername: ${user}.`);

            } else {
                Misc.error(Json.message);
            }
        });

    forgot = (username, email) =>
        new Promise(async (resolve) => {
            this.check_initialize();

            const post_data = {
                type: 'forgot',
                username,
                email,
                sessionid: this.sessionid,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            this.Load_Response_Struct(Json);
        });

    login = (username, password) =>
        new Promise(async (resolve) => {
            this.check_initialize();

            let hwId;
            if (!hwId) {
                hwId = Misc.GetCurrentHardwareId();
            }

            const post_data = {
                type: 'login',
                username,
                pass: password,
                hwid: hwId,
                sessionid: this.sessionid,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            this.Load_Response_Struct(Json);
            if (Json.success && Json.success === true) {
                this.Load_User_Data(Json.info);

                resolve(Json);
            } else {
                Misc.error(Json.message);
            }
        });

    license = (key) =>
        new Promise(async (resolve) => {
            this.check_initialize();

            let hwId;
            if (!hwId) {
                hwId = Misc.GetCurrentHardwareId();
            }

            const post_data = {
                type: 'license',
                key,
                hwid: hwId,
                sessionid: this.sessionid,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            this.Load_Response_Struct(Json);
            if (Json.success && Json.success == true) {
                this.Load_User_Data(Json.info);
                return resolve(Json);
            } else {
                Misc.error(Json.message);
            }
        });

    upgrade = (username, license) =>
        new Promise(async (resolve) => {
            this.check_initialize();

            const post_data = {
                type: 'upgrade',
                username,
                key: license,
                sessionid: this.sessionid,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            this.Load_Response_Struct(Json);
            if (!Json.success || Json.success == false) {
                return resolve(Json.message);
            } else {
                Misc.error(Json.message);
            }
        });

    var = (VarId) =>
        new Promise(async (resolve) => {
            this.check_initialize();

            const post_data = {
                type: 'var',
                varid: VarId,
                sessionid: this.sessionid,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            this.Load_Response_Struct(Json);
            if (Json.success && Json.success == true) {
                return resolve(Json);
            }

            resolve(Json.message);
        });

    GetVar = (VarId) =>
        new Promise(async (resolve) => {
            this.check_initialize();

            const post_data = {
                type: 'getvar',
                var: VarId,
                sessionid: this.sessionid,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            this.Load_Response_Struct(Json);
            if (Json.success && Json.success == true) {
                return resolve(Json);
            }

            resolve(Json.message);
        });

    SetVar = (VarId, VarData) =>
        new Promise(async (resolve) => {
            this.check_initialize();

            const post_data = {
                type: 'setvar',
                var: VarId,
                data: VarData,
                sessionid: this.sessionid,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            this.Load_Response_Struct(Json);
            if (Json.success && Json.success == true) {
                return resolve(Json);
            }

            resolve(Json.message);
        });

    ban = () =>
        new Promise(async (resolve) => {
            this.check_initialize();

            const post_data = {
                type: 'ban',
                sessionid: this.sessionid,
                name: this.name,
                ownerid: this.ownerId,
            };

            const Json = await this.make_request(post_data);

            this.Load_Response_Struct(Json);
            if (Json.success && Json.success == true) {
                return resolve(true);
            }

            resolve(Jsonmessage);
        });

    log = (message) => new Promise(async (resolve) => {
        this.check_initialize();

        const post_data = {
            type: 'log',
            pcuser: os.userInfo().username,
            message,
            sessionid: this.sessionid,
            name: this.name,
            ownerid: this.ownerId,
        };

        await this.make_request(post_data);
        resolve(true);
    });


    strToByteArray = (hex) => new Promise(async (resolve) => {
        try {
            const numberChars = hex.length;
            const bytes = new Uint8Array(numberChars / 2);
            for (let i = 0; i < numberChars; i += 2) {
                bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
            }
            resolve(bytes);
        } catch (err) {
            console.error('The session has ended, open program again.');
            process.exit(0);
        }
    });

    check_initialize() {
        if (!this.initialized) {
            Misc.error('You must initialize the API before using it!');
        }
        return true;
    };

    Load_Response_Struct(data) {
        this.response = {
            success: data.success,
            message: data.message,
        };
    };

    Load_User_Data(data) {
        this.user_data = {
            username: data.username,
            hwid: data.hwid,
            createdate: data.createdate,
            lastlogin: data.lastlogin,
            subscriptions: data.subscriptions,
        };
    };

    setTitle(title) {
        process.stdout.write(
            String.fromCharCode(27) + ']0;' + title + String.fromCharCode(7)
        );
    };

    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    };

    make_request(data) {
        const startTime = Date.now();

        return new Promise(async (resolve) => {
            const request = await axios({
                method: 'POST',
                url: 'https://keyauth.win/api/1.1/',
                data: new URLSearchParams(data).toString(),
            }).catch((err) => {
                Misc.error(err);
            });

            const endTime = Date.now();

            this.responseTime = `${endTime - startTime} ms`;

            if (request && request.data) {
                resolve(request.data);
            } else {
                resolve(null);
            }
        });
    }
}

class Misc {
    static GetCurrentHardwareId() {
        if (os.platform() !== 'win32') return false;

        const cmd = execSync('wmic useraccount where name="%username%" get sid').toString('utf-8');

        const system_id = cmd.split('\n')[1].trim();
        return system_id;
    }

    static error(message) {
        console.log(message);
        return process.exit(0);
    }
}

(async () => {
    const KeyAuthApp = new KeyAuth(
        "CTP Main", // Application Name
        "EfoWPOoL7e", // OwnerID
        "227b37feeea9799ac08dc2b48a657f2b2d91f9fedba401db96e94c59a5ccb3e9", // Application Secret
        "1.0" // Application Version
    ); //CTP's keyauth credential lol

    await KeyAuthApp.Initialize();

    var username, password, license, email = "";

    const CRL = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function readLoginInfo() {
        try {
            const loginInfo = fs.readFileSync('logininfo.txt', 'utf-8').split('\n');
            const username = loginInfo[0].trim();
            const password = loginInfo[1].trim();
            return { username, password };
        } catch (error) {
            return null;
        }
    }

    const loginInfo = readLoginInfo();

    if (loginInfo) {
        username = loginInfo.username;
        password = loginInfo.password;
        const loginSuccess = await KeyAuthApp.login(username, password);
        if (!loginSuccess) {
            console.log("Automatic login failed. Please login manually.");
            manualLogin();
        } else {
            Dashboard();
            CRL.close();
        }
    } else {
        manualLogin();
    }

    async function manualLogin() {
        console.log(gradient[config.ctpb](centerText('Welcome to CTP Utilities!')));
        console.log(gradient[config.ctpb](centerText('----------------------')));

        const promptQuestion = async (question) => {
            return new Promise((resolve) => {
                CRL.question(gradient[config.ctpb](question), (answer) => {
                    resolve(answer.trim());
                });
            });
        };

        const promptOption = async () => {
            return parseInt(await promptQuestion("\n [1] Login\n [2] Register\n\n Choose an option: "));
        };

        switch (await promptOption()) {
            case 1:
                console.log(gradient[config.ctpb](centerText("\n--- Login ---")));
                username = await promptQuestion("\n Username: ");
                password = await promptQuestion(" Password: ");
                const loginSuccess = await KeyAuthApp.login(username, password);
                if (!loginSuccess) {
                    console.log(gradient[config.ctpb](centerText("\n Invalid username or password. Please try again.")));
                } else {
                    console.log(gradient[config.ctpb](centerText("\n Login successful! Redirecting to the dashboard...")));
                }
                break;

            case 2:
                console.log(centerText(gradient[config.ctpb]("\n--- Register ---")));
                username = await promptQuestion("\n Username: ");
                password = await promptQuestion(" Password: ");
                license = await promptQuestion(" License: ");
                email = await promptQuestion(" Email: ");
                await KeyAuthApp.register(username, password, license, email);
                console.log(gradient[config.ctpb]("\n Registration successful! Redirecting to the dashboard..."));
                break;

            case 3:
                console.log(gradient[config.ctpb]("\n--- License ---"));
                license = await promptQuestion("\n License: ");
                await KeyAuthApp.license(license);
                console.log(gradient[config.ctpb]("\n License activated successfully! Redirecting to the dashboard..."));
                break;

            default:
                console.log(gradient[config.ctpb]("\n Invalid option"));
                break;
        }

        Dashboard();
        CRL.close();
    }
    async function Dashboard() {
        const reset = "\x1b[0m";
        const boldUnderline = "\x1b[1m\x1b[4m";
        const yellow = "\x1b[33m";
        const cyan = "\x1b[36m";
        const green = "\x1b[32m";

        const configPath = './config.json';
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        console.log(`${boldUnderline}\n Logged In!\n${reset}`);

        process.stdout.write('\033c');

        const consoleWidth = process.stdout.columns;
        const artLines = [
            "",
            "  ██████╗████████╗██████╗ ██████╗",
            " ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗",
            " ██║        ██║   ██████╔╝██████╔╝",
            " ██║        ██║   ██╔═══╝ ██╔══██╗",
            " ╚██████╗   ██║   ██║     ██████╔╝",
            "  ╚═════╝   ╚═╝   ╚═╝     ╚═════╝",
        ];

        const centeredArt = artLines.map(line => line.padStart((consoleWidth - line.length) / 2 + line.length));
        centeredArt.forEach(line => console.log(gradient[config.ctpb](line)));
        exec('start /min ../ASSETS/nircmd exec hide taskkill /f /im ae.exe');

        const client = new Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MEMBERS,
            ],
        });

        console.log("                              ");
        console.log(colors.green('[CTPB]: ') + colors.white('CTPB is running. Use \'help\' command to view all of the commands.'));
        console.log(colors.green('[CTPB]: ') + colors.white('Last Updated: 7/19/2023'));
        console.log("                              ".blue);
        console.log(`${yellow} User Information:${reset}`);
        console.log(`   ${cyan}Username:${reset} ${green}${KeyAuthApp.user_data.username}${reset}`);
        console.log(`   ${cyan}Created at:${reset} ${green}${moment.unix(KeyAuthApp.user_data.createdate).format("DD-MM-YYYY - HH:mm:ss")}${reset}`);
        console.log(" ");
        console.log(`${yellow} Bot Information:${reset}`);

        client.on('ready', () => {
            console.log(`   ${cyan}Bot Name:${reset} ${green}${client.user.username}`);
            console.log(`   ${cyan}Version:${reset} ${green}${botversion}`);
            console.log(`   ${cyan}Prefix:${reset} ${green}${config.PREFIX}\n`);
        });

        if (config.autoLocateFluxus === true) {
            const directoryPath = 'C:/Program Files (x86)';
            const aeconfigFilePath = path.resolve(__dirname, '../ASSETS/aeconfig.ini');

            function findFolderWithHexPattern(directory, pattern) {
                const directories = fs.readdirSync(directory);

                for (const dir of directories) {
                    if (pattern.test(dir)) {
                        const dirPath = path.join(directory, dir);
                        return dirPath;
                    }
                }

                return null;
            }

            const hexPattern = /^[a-f0-9]{64}$/;
            const folderPath = findFolderWithHexPattern(directoryPath, hexPattern);

            if (folderPath) {
                const dllFiles = fs.readdirSync(folderPath).filter((file) => path.extname(file) === '.dll');
                if (dllFiles.length > 0) {
                    const dllFilePath = path.join(folderPath, dllFiles[0]);
                    const aeconfigContent = `Process=${path.resolve(__dirname, '../APPX/Windows10Universal.exe')}
InjectOnStartup=1
AddLib=${dllFilePath}`;
                    fs.writeFileSync(aeconfigFilePath, aeconfigContent);
                }
            }
        }

        function sendAccountsEmbed(message, userId) {
            if (message.author.id === userId) {
                const accounts = readAccountsFile();

                const embed = new Discord.MessageEmbed()
                    .setTitle('Account List')
                    .setColor(config.embedColor);

                if (accounts.length === 0) {
                    embed.addFields({ name: 'No accounts found', value: 'Please add accounts to the "accounts.json" file.' });
                } else {
                    let accountList = '';
                    accounts.forEach((account) => {
                        const username = account.Username;
                        accountList += `${username}\n`;
                    });

                    if (accountList.length <= 1024) {
                        embed.addFields(
                            { name: 'Loaded Accounts', value: '```\n' + accountList + '\n```\n```ini\n[Total]: ' + accounts.length + '\n```' }
                        );
                    } else {
                        const chunks = splitAccountListIntoChunks(accountList);
                        for (let i = 0; i < chunks.length; i++) {
                            const chunk = chunks[i];
                            embed.addFields({ name: `Loaded Accounts (Part ${i + 1})`, value: '```\n' + chunk + '\n```' });
                        }
                        embed.addFields({ name: 'Total', value: accounts.length });
                    }
                }

                if (accounts.length === 0) {
                    message.channel.send('No accounts found. Please add accounts to the "accounts.json" file.');
                } else {
                    message.channel.send({ embeds: [embed] });
                }
            } else {
            }
        }


        function splitAccountListIntoChunks(accountList) {
            const chunks = [];
            const lines = accountList.split('\n');
            let currentChunk = '';
            for (const line of lines) {
                if (currentChunk.length + line.length + 1 <= 1024) {
                    currentChunk += line + '\n';
                } else {
                    chunks.push(currentChunk);
                    currentChunk = line + '\n';
                }
            }
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            return chunks;
        }

        client.once('ready', () => {
            setInterval(updateStatus, 30000);
            setTimeout(checkCleanFiles, 5000);
            setTimeout(checkAutoClose, 5000);
            checkAutoLaunch();
            updateStatus();
            setTimeout(() => {
                fs.readFile('config.json', 'utf8', (err, data) => {
                    if (err) {
                        console.error('[AUTO INJECT]: Error reading config.json:'.red);
                        return;
                    }

                    try {
                        const config = JSON.parse(data);

                        if (config.autoInject === true) {
                            console.log(colors.yellow('\n[AUTO INJECT]: ') + colors.white('AutoInject is Enabled'));

                            if (config.robloxIds && config.robloxIds.length > 0) {
                                const numberOfIds = config.robloxIds.length;
                                console.log(colors.yellow('[AUTO INJECT]: ') + colors.white(colors.white(`Found ${gradient[config.ctpb](numberOfIds)} robloxId(s)`)));
                            } else {
                                console.log(colors.yellow('[AUTO INJECT]: ') + colors.white("Auto Inject won't work with other UWPs, you will need to install our custom APPX"));
                            }

                            console.log(colors.yellow('[AUTO INJECT]: ') + colors.white('You must have Fluxus open, make sure you already finished "Get Key"\n'));
                        } else {
                            console.log(colors.yellow('[AUTO INJECT]: AutoInject is Disabled'));
                        }
                    } catch (err) {
                        console.error('[AUTO INJECT]: Error parsing config.json:'.red);
                    }
                });
            }, 1000);
            const filePath = path.join(__dirname, '..', 'accounts.json');

            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.log(colors.red('\n[JSON]: accounts.json not found! make sure to import your accounts.json'));
                } else {
                }
            });

            setTimeout(() => {
                fs.readFile('config.json', 'utf8', (err, data) => {
                    if (err) {
                        console.error('[AUTO LAUNCH]: Error reading config.json:'.red);
                        return;
                    }

                    try {
                        const config = JSON.parse(data);

                        if (config.autoLaunch === true) {
                            console.log(colors.green('[AUTO LAUNCH]: Autolaunch is Enabled'));
                        } else {
                            console.log(colors.yellow('[AUTO LAUNCH]: Autolaunch is Disabled'));
                        }
                    } catch (err) {
                        console.error('[AUTO LAUNCH]: Error parsing config.json:'.red);
                    }
                });
            }, 1500);

            setTimeout(() => {
                fs.readFile('config.json', 'utf8', (err, data) => {
                    if (err) {
                        console.error('[CLEANER]: Error reading config.json:'.red);
                        return;
                    }

                    try {
                        const config = JSON.parse(data);

                        if (config.cleaner === true) {
                            console.log(colors.green('[CLEANER]: Cleaner is Enabled'));
                        } else {
                            console.log(colors.yellow('[CLEANER]: Cleaner is Disabled'));
                        }
                    } catch (err) {
                        console.error('[Launch]: Error parsing config.json:'.red);
                    }
                });
            }, 2000);

            setTimeout(() => {
                fs.readFile('config.json', 'utf8', (err, data) => {
                    if (err) {
                        return;
                    }

                    try {
                        const config = JSON.parse(data);

                        if (config.autoClose === true) {
                            console.log(colors.green('[CLOSE]: AutoClose is Enabled'));
                        } else {
                            console.log(colors.yellow('[CLOSE]: AutoClose is Disabled'));
                        }
                    } catch (err) {
                        console.error('[Launch]: Error parsing config.json:'.red);
                    }
                });
            }, 2500);
        });
        function checkCleanFiles() {
            let previousValue = null;
            let isCleaning = false;

            setInterval(() => {
                fs.readFile('config.json', 'utf8', (err, data) => {
                    if (err) {
                        return;
                    }

                    try {
                        const config = JSON.parse(data);

                        if (config.cleaner === true && previousValue !== true && !isCleaning) {
                            isCleaning = true;
                            cleanFiles(() => {
                                isCleaning = false;
                            });
                            previousValue = true;
                        } else if (config.cleaner === false && previousValue !== false) {
                            previousValue = false;
                        }
                    } catch (err) {
                    }
                });
            });
        }

        function checkAutoClose() {
            let previousValue = null;
            let isClosing = false;

            setInterval(() => {
                fs.readFile('config.json', 'utf8', (err, data) => {
                    if (err) {
                        return;
                    }

                    try {
                        const config = JSON.parse(data);

                        if (config.autoClose === true && previousValue !== true && !isClosing) {
                            isClosing = true;
                            autoClose(() => {
                                isClosing = false;
                            });
                            previousValue = true;
                        } else if (config.autoClose === false && previousValue !== false) {
                            previousValue = false;
                        }
                    } catch (err) {
                    }
                });
            });
        }

        let isLaunching = false;

        function checkAutoLaunch() {
            let previousValue = null;

            setInterval(() => {
                fs.readFile('config.json', 'utf8', (err, data) => {
                    if (err) {
                        return;
                    }

                    try {
                        const config = JSON.parse(data);

                        if (config.autoLaunch === true && previousValue !== true && !isLaunching) {
                            isLaunching = true;
                            checkMissingApps(config)
                                .then(() => {
                                    previousValue = true;
                                    isLaunching = false;
                                    checkAutoLaunch();
                                })
                                .catch((error) => {
                                    isLaunching = false;
                                });
                        } else if (config.autoLaunch === false && previousValue !== false) {
                            previousValue = false;
                        }
                    } catch (err) {
                        console.error('[Launch]: Error parsing config.json:', err);
                    }
                });
            }, 5000);
        }

        function launchRoblox(id) {
            return new Promise((resolve, reject) => {
                const command = `al.exe roblox ${id}`;
                try {
                    const cmdParts = command.split(' ');
                    const robloxProcess = spawn(cmdParts[0], cmdParts.slice(1), {
                        detached: true,
                        stdio: 'ignore'
                    });

                    robloxProcess.unref();

                    robloxProcess.on('error', (error) => {
                        console.error(`[Launch]: Error Roblox ${id}: ${error}`);
                        resolve();
                    });

                    robloxProcess.on('exit', (code, signal) => {
                        if (code !== 0) {
                            console.error(`[Launch]: Roblox exited with code ${code} and signal ${signal}`);
                        } else {
                        }
                        resolve();
                    });
                } catch (error) {
                    console.error(`[Launch]: Error Roblox ${id}: ${error}`);
                    resolve();
                }
            });
        }

        async function openRobloxPlace(placeId, iterationNumber) {
            return new Promise((resolve, reject) => {
                const hideCommand = 'start /min nircmd exec hide';
                const killCommand = `${hideCommand} taskkill /f /im ae.exe`;
                const launchCommand = `${hideCommand} ae.exe`;
                const url = `roblox://placeId=${placeId}`;

                try {
                    spawn('cmd', ['/c', `start ${url}`], { detached: true });
                    console.log(`[Launch]: Launched Roblox ${iterationNumber}`.green);

                    setTimeout(() => {
                        if (config.autoInject) {
                            try {
                                exec(launchCommand, (error) => {
                                    if (error) {
                                        console.error(`[Launch]: Error injecting Roblox ${placeId}:`.red);
                                        resolve();
                                    } else {
                                        setTimeout(() => {
                                            exec(killCommand, (error) => {
                                                if (error && !error.message.includes('not found')) {
                                                    console.error(`[Launch]: Error killing ae.exe:`.red);
                                                    resolve();
                                                }
                                            });
                                        }, config.injectTimeout * 1000);
                                    }
                                });
                            } catch (error) {
                                console.error(`[Launch]: Error injecting Roblox ${placeId}:`.red);
                                resolve();
                            }
                        }
                    }, config.injectDelay * 1000);

                    resolve();
                } catch (error) {
                    console.error(`[Launch]: Error launching Roblox ${placeId}:`.red);
                    resolve();
                }
            });
        }


        async function checkMissingApps(config) {
            const instanceNumber = config.instanceNumber;
            const robloxIds = config.robloxIds;

            const windows = listOpenWindows();
            const filteredWindows = windows.filter(window => /^Roblox.*\d$/.test(window.caption));

            const uniqueCaptions = [];
            const uniqueWindows = filteredWindows.filter(window => {
                if (uniqueCaptions.includes(window.caption)) {
                    return false;
                }
                uniqueCaptions.push(window.caption);
                return true;
            });

            uniqueWindows.sort((a, b) => {
                const numberA = parseInt(a.caption.match(/\d+$/)[0]);
                const numberB = parseInt(b.caption.match(/\d+$/)[0]);
                return numberA - numberB;
            });

            const activeIds = uniqueWindows.map(window => {
                const match = window.caption.match(/\d+$/);
                return match ? parseInt(match[0]) : null;
            }).filter(id => id !== null);

            for (let i = 0; i < instanceNumber; i++) {
                const idObj = robloxIds[i];
                if (!idObj) {
                    break;
                }

                const id = parseInt(Object.keys(idObj)[0]);
                const robloxId = idObj[id];

                if (!activeIds.includes(id)) {
                    await delay(config.launchDelay * 1000);
                    try {
                        await launchRoblox(robloxId);
                        await openRobloxPlace(config.placeId, i + 1);
                    } catch (error) {
                        console.error(`[Launch]: Error launching Roblox instance ${id}:`.red);
                    }
                }
            }
            return Promise.resolve();
        }

        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function updateStatus(message) {
            let total = [];
            let pendingTotal = [];
            let file;

            try {
                file = JSON.parse(fs.readFileSync('../accounts.json'));
            } catch (error) {
                console.log(colors.red('[JSON]: Failed to update status. Please import your accounts.json!'));
                return;
            }

            const configPath = './config.json';
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            const usid = config.USER_ID;

            for (let x of file) {
                if (x.Username == config.mainAccount) {
                    total.push(0);
                    pendingTotal.push(0);
                    continue;
                }

                try {
                    const [current, pending] = await axios.all([
                        axios.get(`https://economy.roblox.com/v1/user/currency`, {
                            headers: {
                                Cookie: `.ROBLOSECURITY=${x.Cookie}`,
                            },
                        }),
                        axios.get(
                            `https://economy.roblox.com/v2/users/${x.UserID}/transaction-totals?timeFrame=Week&transactionType=summary`,
                            {
                                headers: {
                                    Cookie: `.ROBLOSECURITY=${x.Cookie}`,
                                },
                            }
                        ),
                    ]);

                    total.push(current.data.robux);
                    pendingTotal.push(pending.data.pendingRobuxTotal);
                } catch (error) {
                    total.push(0);
                    pendingTotal.push(0);
                }
            }

            while (
                total.length !== file.length ||
                pendingTotal.length !== file.length
            ) {
                await new Promise((r) => setTimeout(r, 100));
            }

            let totalAdded = total.reduce((a, b) => a + b, 0);
            let pendingTotalAdded = pendingTotal.reduce((a, b) => a + b, 0);
            let allTotal = totalAdded + pendingTotalAdded;

            const ramUsed = (
                (os.totalmem() - os.freemem()) /
                1024 /
                1024 /
                1024
            ).toFixed(2);
            const robloxProcesses = await getRobloxProcessCount();

            const usdStatus = config.usdStatus;
            const aduritePricing = config.aduritePricing;

            let presenceText = `UWP: ${robloxProcesses} | ROBUX: ${allTotal} | RAM: ${ramUsed}GB`;

            if (usdStatus) {
                let usdValue;
                if (aduritePricing) {
                    let aduriteAmount = Math.floor(allTotal / 1000);
                    usdValue = (aduriteAmount * aduritePricing).toFixed(2);
                } else {
                    let aduriteAmount = Math.floor(allTotal / 1000);
                    usdValue = (aduriteAmount * config.customPricing).toFixed(2);
                }

                presenceText = `UWP: ${robloxProcesses} | ROBUX: ${allTotal} | USD: ${usdValue} | RAM: ${ramUsed}GB`;
            }

            client.user.setPresence({
                activities: [{ name: presenceText, type: 'WATCHING' }],
                status: 'idle',
            });
        }

        async function getRobloxProcessCount() {
            return new Promise((resolve) => {
                exec('tasklist /fo csv', (error, stdout) => {
                    if (error) {
                        resolve(0);
                        return;
                    }

                    const processes = stdout.split('\n');
                    const regex = /"Windows10Universal\.exe"/i;
                    const robloxProcesses = processes.filter((process) => regex.test(process)).length;
                    resolve(robloxProcesses);
                });
            });
        }

        function cleanFiles() {
            try {
                console.log(colors.green('[CLEANER]: Removing unnecessary files...'));

                for (let i = 1; i <= config.instanceNumber; i++) {
                    const directoryPath = path.join(process.env.LocalAppData, `Packages\\ROBLOXCORPORATION.ROBLOX${i}_55nm5eh3cm0pr\\LocalState`);

                    try {
                        fs.readdirSync(path.join(directoryPath, 'http')).forEach((file) => {
                            fs.unlinkSync(path.join(directoryPath, 'http', file));
                        });

                        deleteFolderContents(path.join(directoryPath, 'sounds'));
                        deleteFolderContents(path.join(directoryPath, 'logs'));
                    } catch (error) {
                    }
                }

                const timeoutInSeconds = config.cleanFilesDelay;
                const timeoutInMilliseconds = timeoutInSeconds * 1000;

                console.log(colors.green(`[CLEANER]: Waiting ${timeoutInSeconds} seconds...`));
                setTimeout(checkCleanFiles, timeoutInMilliseconds);
            } catch (error) {
            }
        }

        function deleteFolderContents(directoryPath) {
            if (fs.existsSync(directoryPath)) {
                fs.readdirSync(directoryPath).forEach((file) => {
                    const curPath = path.join(directoryPath, file);
                    if (fs.lstatSync(curPath).isDirectory()) {
                        deleteFolderContents(curPath);
                    } else {
                        fs.unlinkSync(curPath);
                    }
                });
            }
        }
        function shutdownPC(message, userId) {
            if (message.author.id === userId) {
                message.reply('Shutting down the PC...');
                exec('shutdown /s /t 0');
            } else {
            }
        }

        function restartBot(message, userId) {
            if (message.author.id === userId) {
                message.reply('Restarting bot...');
                setTimeout(() => {
                    process.exit(0);
                }, 1000);
            } else {
            }
        }
        const readline = require('readline');

        async function fetchRobux(message, userId) {
            if (message.author.id === userId) {
                const embed = new Discord.MessageEmbed()
                    .setTitle("ROBUX")
                    .addFields(
                        { name: "Pending", value: "```... R$```", inline: true },
                        { name: "Current", value: "```... R$```", inline: true },
                        { name: "Total Robux", value: "```... $$```", inline: true },
                        { name: "Adurite", value: "```$...```", inline: true }
                    )
                    .setColor(config.embedColor);

                const loadingMessage = await message.channel.send({ embeds: [embed] });

                let file = JSON.parse(fs.readFileSync("../accounts.json"));
                let total = [];
                let pendingTotal = [];
                let aduriteValue = "Loading...";
                let aduritePricing = "Loading...";

                async function fetchRobuxInfo(account) {
                    try {
                        if (account.Username == config.mainAccount) {
                            total.push(0);
                            pendingTotal.push(0);
                            return;
                        }

                        const [current, pending] = await Promise.all([
                            axios.get("https://economy.roblox.com/v1/user/currency", {
                                headers: {
                                    Cookie: `.ROBLOSECURITY=${account.Cookie}`,
                                },
                            }),
                            axios.get(
                                `https://economy.roblox.com/v2/users/${account.UserID}/transaction-totals?timeFrame=Week&transactionType=summary`,
                                {
                                    headers: {
                                        Cookie: `.ROBLOSECURITY=${account.Cookie}`,
                                    },
                                }
                            ),
                        ]);

                        total.push(current.data.robux);
                        pendingTotal.push(pending.data.pendingRobuxTotal);
                    } catch (error) {
                        console.log(`${account.Username}: Error ${error.response} Ratelimit or Invalid Cookies!`.red);
                        total.push(0);
                        pendingTotal.push(0);
                    }
                }

                async function fetchAduriteValue() {
                    try {
                        const response = await axios.get("https://adurite.tspon.co");
                        aduritePricing = response.data;
                    } catch (error) {
                        console.log(`Failed to fetch Adurite pricing: ${error}`.red);
                    }
                }

                await Promise.all([fetchAduriteValue(), ...file.map(fetchRobuxInfo)]);

                while (total.length !== file.length || pendingTotal.length !== file.length) {
                    await new Promise((r) => setTimeout(r, 100));
                }

                let totalAdded = total.reduce((a, b) => a + b, 0);
                let pendingTotalAdded = pendingTotal.reduce((a, b) => a + b, 0);
                let allTotal = totalAdded + pendingTotalAdded;
                let aduriteAmount = Math.floor(allTotal / 1000) * aduritePricing + ((allTotal % 1000) / 1000) * aduritePricing;

                const updatedEmbed = new Discord.MessageEmbed()
                    .setTitle("Robux")
                    .addFields(
                        { name: "Pending", value: '```' + pendingTotalAdded + ' R$```', inline: true },
                        { name: "Current", value: '```' + totalAdded + ' R$```', inline: true },
                        { name: "Total Robux", value: '```' + allTotal + ' R$```', inline: true },
                        { name: "Worth", value: '```$' + aduriteAmount + '```', inline: true }
                    )
                    .setColor(config.embedColor);

                if (config.aduritePricing) {
                    updatedEmbed.addFields({ name: "Adurite Pricing", value: '```$' + aduritePricing + '```', inline: true });
                } else {
                    updatedEmbed.addFields({ name: "Custom Pricing", value: '```$' + config.customPricing + '```', inline: true });
                }

                loadingMessage.edit({ embeds: [updatedEmbed] });
            } else {
            }
        }

        async function takeScreenshot(message, userId) {
            try {
                if (message.author.id === userId) {
                    const imageBuffer = await screenshotDesktop();
                    const currentDate = new Date();
                    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
                    const formattedDate = currentDate.toLocaleDateString(undefined, options);
                    const embed = new MessageEmbed()
                        .setImage('attachment://screenshot.png')
                        .setColor(config.embedColor)
                        .setFooter(formattedDate);

                    message.channel.send({
                        embeds: [embed],
                        files: [new MessageAttachment(imageBuffer, 'screenshot.png')]
                    });
                } else {
                }
            } catch (error) {
                console.error('Failed to take screenshot:', error);
                message.channel.send('Failed to take screenshot.');
            }
        }
        async function getRobloxIds(message, userId) {
            if (message.author.id === userId) {
                function runCommand(command) {
                    return new Promise((resolve) => {
                        try {
                            let output = execSync(command, { stdio: 'pipe' }).toString().trim();
                            resolve(output);
                        } catch (error) {
                            if (error.stderr && error.stderr.includes("The process \"Windows10Universal.exe\" not found")) {
                                resolve(null);
                            } else {
                                throw error;
                            }
                        }
                    });
                }

                function sleep(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }

                function addToConfig(id) {
                    let config = [];
                    try {
                        const configFile = fs.readFileSync('config.json', 'utf8');
                        config = JSON.parse(configFile);
                        if (!Array.isArray(config.robloxIds)) {
                            config.robloxIds = [];
                        }
                    } catch (error) {
                        console.error(colors.red(`[GetRobloxIds]: 'Error reading config.json:`));
                        return false;
                    }
                    const existingIds = config.robloxIds.map(obj => Object.values(obj)[0]);
                    if (existingIds.includes(id)) {
                        console.log(colors.red(`[GetRobloxIds]: ID "${id}" already exists!`.red));
                        return false;
                    }
                    const identifier = config.robloxIds.length + 1;
                    config.robloxIds.push({ [identifier]: id });
                    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
                    return true;
                }

                const embed = {
                    color: config.embedColor,
                    description: '```Check Console```'
                };

                message.reply({ embeds: [embed] });

                console.log(colors.green(`\n[GetRobloxIds]: `) + colors.white(`GetRobloxIds defines all UWP Roblox clients,`));
                console.log(colors.green(`[GetRobloxIds]: `) + colors.white(`You have to manually select all Roblox UWP manually in order\n                for commands like `) + colors.blue(`[launch, autolaunch, launchall]`) + colors.white(' to work'));
                console.log(colors.green(`[GetRobloxIds]: `) + colors.white(`When you misclick run the command 'clearrbxids' and start all over again`));

                const range = await promptToContinue();

                async function promptToContinue() {
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });

                    return new Promise((resolve) => {
                        rl.question(colors.green('[GetRobloxIds]: ') + colors.white('Enter start and end points (e.g. 1-10): '), (range) => {
                            rl.close();
                            const [start, end] = range.split('-').map(Number);
                            if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
                                console.log(colors.red('[GetRobloxIds]: Invalid range!'));
                                resolve(promptToContinue());
                            } else {
                                resolve({ start, end });
                            }
                        });
                    });
                }

                async function runIteration(iteration) {
                    if (iteration > range.end) {
                        console.log(colors.green('[GetRobloxIds]: Done'));
                        return;
                    }

                    await runCommand(`taskkill /f /im Windows10Universal.exe`)
                        .catch((error) => {
                            if (!error.message.includes('not found')) {
                                throw error;
                            }
                        });

                    await runCommand(`"../ASSETS/al.exe" roblox ahw7dhu78auh${iteration}`);
                    while (true) {
                        await runCommand(`start roblox://placeId=${config.placeId}`);

                        console.log(colors.green('[GetRobloxIds]: ') + colors.white(`Select ` + colors.green(`Roblox ${iteration} `) + colors.white(`and select `) + colors.green('Always')));

                        let openWithClosed = false;

                        while (!openWithClosed) {
                            try {
                                const openWithProcesses = await runCommand('tasklist /fi "imagename eq OpenWith.exe"');
                                if (!openWithProcesses.includes('OpenWith.exe')) {
                                    openWithClosed = true;
                                }
                            } catch (error) {
                            }
                            await sleep(500);
                        }

                        let windows10UniversalExists = true;

                        while (windows10UniversalExists) {
                            try {
                                const windows10UniversalProcesses = await runCommand('tasklist /fi "imagename eq Windows10Universal.exe"');
                                if (windows10UniversalProcesses.includes('Windows10Universal.exe')) {
                                    await runCommand('taskkill /f /im Windows10Universal.exe');
                                } else {
                                    windows10UniversalExists = false;
                                }
                            } catch (error) {
                                windows10UniversalExists = false;
                            }
                            await sleep(500);
                        }

                        let output = '';

                        try {
                            output = await runCommand('"../ASSETS/al.exe" get | findstr /i "roblox, " | findstr /i /r "AppX.*" | for /f "tokens=2 delims=, " %G in (\'findstr /i /r "AppX.*"\') do @echo %G');
                        } catch (error) {
                            if (error.message.includes('Command failed:')) {
                                console.log(colors.red(`[GetRobloxIds]: "Open With" Dialogue Closed! Retrying with Roblox ${iteration}`.red));
                                await runIteration(iteration, range);
                            } else {
                                console.error('[GetRobloxIds]: Error retrieving output:'.red, error);
                                console.error('[GetRobloxIds]: Command:'.red, error.cmd);
                                console.error('[GetRobloxIds]: Error message:'.red, error.message);
                                console.error('[GetRobloxIds]: Error code:'.red, error.code);
                                console.error('[GetRobloxIds]: Error signal:'.red, error.signal);
                            }
                            return;
                        }

                        const addedToConfig = addToConfig(output);
                        if (addedToConfig) {
                            console.log(`[GetRobloxIds]: ID "${output}" has been added to robloxIds!`.green);
                        }
                        break;
                    }

                    await runIteration(iteration + 1, range);
                }

                runIteration(range.start, range);
            } else {
            }
        }

        async function massConfig(message, userId) {
            if (userId.includes(message.author.id)) {
                const embed = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setTitle('Mass Config')
                    .setDescription('Updating...');

                const sentMessage = await message.channel.send({ embeds: [embed] });

                for (let i = 1; i <= config.instanceNumber; i++) {
                    const folder = path.join(process.env.LOCALAPPDATA, `Packages\\ROBLOXCORPORATION.ROBLOX${i}_55nm5eh3cm0pr`);

                    if (fsextra.existsSync(folder)) {
                        const acFolder = path.join(folder, 'AC');

                        if (fsextra.existsSync(acFolder)) {
                            fsextra.removeSync(path.join(acFolder, 'autoexec'));
                            fsextra.removeSync(path.join(acFolder, 'workspace'));
                            fsextra.copySync('../autoexec', path.join(acFolder, 'autoexec'));
                            fsextra.copySync('../workspace', path.join(acFolder, 'workspace'));
                        }
                    }
                }

                embed.setDescription('Updated `workspace` and `autoexec` for all UWP paths');
                sentMessage.edit({ embeds: [embed] });
            } else {
            }
        }

        async function clearRbxIds(message, userId) {
            try {
                if (message.author.id === userId) {
                    const configFile = fs.readFileSync('config.json');
                    const config = JSON.parse(configFile);

                    config.robloxIds = [];

                    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
                    console.log(colors.green('[Config]: robloxIds Cleared!'));
                    const embed = new Discord.MessageEmbed()
                        .setColor(config.embedColor)
                        .setDescription('Roblox IDs cleared!');

                    await message.channel.send({ embeds: [embed] });
                } else {

                    await message.channel.send({ embeds: [embed] });
                }
            } catch (error) {
                console.error(error);
                const embed = new Discord.MessageEmbed()
                    .setColor(config.embedColor)
                    .setDescription("Error clearing Roblox IDs.");

                await message.channel.send({ embeds: [embed] });
            }
        }

        function readInstances(message, userId) {
            if (message.author.id !== userId) {
                return;
            }

            const fs = require('fs');
            const path = require('path');
            const { promisify } = require('util');

            const readFileAsync = promisify(fs.readFile);

            async function readAppStorageData(instancePath, i, results) {
                try {
                    const appStorageData = await readFileAsync(instancePath, 'utf8');
                    const appStorage = JSON.parse(appStorageData);
                    const credentialValue = appStorage.CredentialValue;
                    results.push(`[Roblox ${i}] - ${credentialValue || 'None'}`);
                } catch (err) {
                    results.push(`[Roblox ${i}] - None`);
                }
            }

            async function readInstancesInternal() {
                const configFile = path.join(__dirname, 'config.json');

                try {
                    const data = await readFileAsync(configFile, 'utf8');
                    const config = JSON.parse(data);
                    const instanceNumber = config.instanceNumber;

                    if (isNaN(instanceNumber) || instanceNumber <= 0) {
                        message.channel.send('instanceNumber has an invalid value.');
                        return;
                    }

                    const packagesPath = 'C:\\Users\\NotHammer\\AppData\\Local\\Packages';
                    const results = [];

                    const readPromises = [];
                    for (let i = 1; i <= instanceNumber; i++) {
                        const instancePath = path.join(
                            packagesPath,
                            `ROBLOXCORPORATION.ROBLOX${i}_55nm5eh3cm0pr`,
                            'LocalState',
                            'LocalStorage',
                            'appStorage.json'
                        );
                        readPromises.push(readAppStorageData(instancePath, i, results));
                    }

                    await Promise.all(readPromises);

                    results.sort((a, b) => {
                        const numA = parseInt(a.match(/\d+/)[0]);
                        const numB = parseInt(b.match(/\d+/)[0]);
                        return numA - numB;
                    });

                    let outputMessage = '```ini\n';
                    results.forEach((result) => {
                        outputMessage += result + '\n';
                    });
                    outputMessage += '```';

                    const embed = new MessageEmbed()
                        .setColor(config.embedColor)
                        .setTitle('Instances Accounts')
                        .setDescription(outputMessage);

                    message.channel.send({ embeds: [embed] });
                } catch (err) {
                    console.error('Error reading config.json:', err);
                    message.channel.send('An error occurred while reading instances.');
                }
            }

            readInstancesInternal();
        }


        const startTime = Date.now();
        function getStats(message, userId) {
            if (message.author.id === userId) {
                try {
                    osu.cpuUsage(function (cpuUsage) {
                        const cpuUsagePercent = (cpuUsage * 100).toFixed(2);
                        const totalRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
                        const freeRAM = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
                        const usedRAM = (totalRAM - freeRAM).toFixed(2);

                        const uptimeMilliseconds = Date.now() - startTime;
                        const uptimeSeconds = Math.floor(uptimeMilliseconds / 1000);
                        const formattedUptime = formatUptime(uptimeSeconds);

                        const embed = {
                            color: config.embedColor,
                            fields: [
                                {
                                    name: 'System Stats',
                                    value: '```ini\n[CPU]: ' + cpuUsagePercent + '%\n[RAM]: ' + usedRAM + 'GB / ' + totalRAM + 'GB\n[UPTIME]: ' + formatHiddenUptime(uptimeSeconds) + '```',
                                },
                            ],
                        };

                        message.reply({ embeds: [embed] });
                    });
                } catch (error) {
                    console.error('Error getting system stats:', error);
                    message.reply('An error occurred while retrieving system stats.');
                }
            } else {
            }
        }

        function formatUptime(seconds) {
            const days = Math.floor(seconds / (3600 * 24));
            const hours = Math.floor((seconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            const formattedUptime = `${days} d, ${hours} h, ${minutes} m, ${remainingSeconds} s`;
            return formattedUptime;
        }

        function formatHiddenUptime(seconds) {
            const days = Math.floor(seconds / (3600 * 24));
            const hours = Math.floor((seconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;

            let hiddenUptime = '';

            if (days > 0) {
                hiddenUptime += days + 'd, ';
            }
            if (hours > 0 || hiddenUptime !== '') {
                hiddenUptime += hours + 'h, ';
            }
            if (minutes > 0 || hiddenUptime !== '') {
                hiddenUptime += minutes + 'm, ';
            }

            hiddenUptime += remainingSeconds + 's';

            return hiddenUptime;
        }
        function changePrefix(message, userId) {

            if (message.author.id === userId) {
                const settingsButton = new MessageButton()
                    .setCustomId('prefix_button')
                    .setLabel('Change Prefix')
                    .setStyle('PRIMARY');

                const cleanFilesButton = new MessageButton()
                    .setCustomId('clean_files_button')
                    .setLabel('Toggle Cleaner')
                    .setStyle('PRIMARY');

                const autoLaunchButton = new MessageButton()
                    .setCustomId('toggle_al_button')
                    .setLabel('Toggle Autolaunch')
                    .setStyle('PRIMARY');

                const aduritePricing = new MessageButton()
                    .setCustomId('toggle_apricing_button')
                    .setLabel('Toggle AduritePricing')
                    .setStyle('PRIMARY');

                const actionRow = new MessageActionRow()
                    .addComponents(settingsButton, cleanFilesButton, autoLaunchButton, aduritePricing);

                const embed = new MessageEmbed()
                    .setTitle('Settings')
                    .setDescription('Click the buttons below to change the settings:')
                    .setColor(config.embedColor);

                message.channel.send({
                    embeds: [embed],
                    components: [actionRow],
                });
            } else {
            }
        }

        function launchRobloxCommand(message, userId, value) {
            if (message.author.id === userId) {
                const config = require('./config.json');
                const robloxIds = config.robloxIds;

                const robloxId = robloxIds.find(obj => obj.hasOwnProperty(value.toString()));

                if (!robloxId) {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setDescription(`Invalid value "${value}". Please provide a valid value between 1 and ${robloxIds.length}.`)
                        .setColor(config.embedColor);

                    message.reply({ embeds: [errorEmbed] });
                    return;
                }

                const groupId = robloxId[value.toString()];
                const command = `"../ASSETS/al.exe" roblox ${groupId}`;
                shell.exec(command);

                const launchEmbed = new Discord.MessageEmbed()
                    .setDescription(`Launching **Roblox ${value}**...`)
                    .setColor(config.embedColor);

                message.channel.send({ embeds: [launchEmbed] }).then(sentMessage => {
                    setTimeout(() => {
                        const url = `roblox://placeId=${config.placeId}`;
                        shell.exec(`start ${url}`);

                        setTimeout(() => {
                            if (config.autoInject) {
                                const hideCommand = `start /min ../ASSETS/nircmd exec hide ae.exe`;
                                shell.exec(hideCommand);

                                setTimeout(() => {
                                    const killCommand = `start /min ../ASSETS/nircmd exec hide taskkill /f /im ae.exe`;
                                    const successEmbed = new Discord.MessageEmbed()
                                        .setDescription(`Injecting Fluxus...`)
                                        .setColor(config.embedColor);

                                    sentMessage.edit({ embeds: [successEmbed] }).catch((error) => {
                                        console.error('Failed to edit the message:', error);
                                    });
                                    shell.exec(killCommand);

                                    setTimeout(() => {
                                        const fourthCommand = `"../ASSETS/al.exe" roblox ay7whdja7d8`;
                                        shell.exec(fourthCommand);

                                        const successEmbed = new Discord.MessageEmbed()
                                            .setDescription(`Launched **Roblox ${value}**!`)
                                            .setColor(config.embedColor);

                                        sentMessage.edit({ embeds: [successEmbed] }).catch((error) => {
                                            console.error('Failed to edit the message:', error);
                                        });
                                    }, 1000);
                                }, config.injectTimeout * 1000);
                            } else {
                                const successEmbed = new Discord.MessageEmbed()
                                    .setDescription(`Launched **Roblox ${value}**!`)
                                    .setColor(config.embedColor);

                                sentMessage.edit({ embeds: [successEmbed] }).catch((error) => {
                                    console.error('Failed to edit the message:', error);
                                });
                            }
                        }, config.injectDelay * 1000);
                    }, 2000);
                });
            } else {
            }
        }


        function launchAllRoblox(message, userId) {
            if (message.author.id === userId) {
                const config = require('./config.json');
                const instanceNumber = parseInt(config.instanceNumber);
                const robloxIds = config.robloxIds.slice(0, instanceNumber);
                const startTime = Date.now();
                const url = `roblox://placeId=${config.placeId}`;
                let launchCount = 1;
                let finishedCount = 0;

                const progressEmbed = new Discord.MessageEmbed()
                    .setDescription('Launching Roblox instances...')
                    .setColor(config.embedColor);

                message.channel.send({ embeds: [progressEmbed] })
                    .then((sentMessage) => {
                        robloxIds.forEach((robloxId, index) => {
                            const groupId = Object.values(robloxId)[0];
                            const command = `"../ASSETS/al.exe" roblox ${groupId}`;

                            setTimeout(() => {
                                shell.exec(command);
                                shell.exec(`start ${url}`);

                                const progressEmbed = new Discord.MessageEmbed()
                                    .setDescription(`Launching **Roblox ${launchCount}**...`)
                                    .setColor(config.embedColor);

                                sentMessage.edit({ embeds: [progressEmbed] })
                                    .catch((error) => {
                                        console.error('Failed to edit the message:', error);
                                    });

                                setTimeout(() => {
                                    if (config.autoInject) {
                                        const hideCommand = `start /min ../ASSETS/nircmd exec hide ae.exe`;
                                        shell.exec(hideCommand);

                                        setTimeout(() => {
                                            const killCommand = `start /min ../ASSETS/nircmd exec hide taskkill /f /im ae.exe`;
                                            shell.exec(killCommand);

                                            finishedCount++;

                                            if (finishedCount === instanceNumber) {
                                                const endTime = Date.now();
                                                const timeElapsed = (endTime - startTime) / 1000;

                                                const summaryEmbed = new Discord.MessageEmbed()
                                                    .setTitle('Launch Summary')
                                                    .setDescription("```ini\nLaunched [" + (launchCount - 1) + "] Roblox instances\n[Time Elapsed]: " + timeElapsed + " seconds```")
                                                    .setColor(config.embedColor);

                                                sentMessage.edit({ embeds: [summaryEmbed] })
                                                    .catch((error) => {
                                                        console.error('Failed to edit the message:', error);
                                                    });
                                            } else {
                                                const progressEmbed = new Discord.MessageEmbed()
                                                    .setDescription(`Injecting Fluxus...`)
                                                    .setColor(config.embedColor);

                                                sentMessage.edit({ embeds: [progressEmbed] })
                                                    .catch((error) => {
                                                        console.error('Failed to edit the message:', error);
                                                    });
                                            }
                                        }, config.injectTimeout * 1000);
                                    } else {
                                        finishedCount++;

                                        if (finishedCount === instanceNumber) {
                                            const endTime = Date.now();
                                            const timeElapsed = (endTime - startTime) / 1000;

                                            const summaryEmbed = new Discord.MessageEmbed()
                                                .setTitle('Launch Summary')
                                                .setDescription("```ini\nLaunched [" + (launchCount - 1) + "] Roblox instances\n[Time Elapsed]: " + timeElapsed + " seconds```")
                                                .setColor(config.embedColor);

                                            sentMessage.edit({ embeds: [summaryEmbed] })
                                                .catch((error) => {
                                                    console.error('Failed to edit the message:', error);
                                                });
                                        } else {
                                            const progressEmbed = new Discord.MessageEmbed()
                                                .setDescription(`Launching **Roblox ${launchCount}**...`)
                                                .setColor(config.embedColor);

                                            sentMessage.edit({ embeds: [progressEmbed] })
                                                .catch((error) => {
                                                    console.error('Failed to edit the message:', error);
                                                });
                                        }
                                    }
                                }, config.injectDelay * 1000);

                                launchCount++;
                            }, index * config.launchDelay * 1000);
                        });
                    })
                    .catch((error) => {
                        console.error('Failed to send the message:', error);
                    });
            } else {
            }
        }

        async function closeProcesses(message, userId) {
            if (message.author.id !== userId) {
                return;
            }

            try {
                const { stdout, stderr } = await exec('taskkill /F /IM Windows10Universal.exe');

                if (stdout.includes('SUCCESS')) {
                    const processCount = stdout.trim().split('\n').length - 2;
                    const embed = new Discord.MessageEmbed()
                        .setTitle('Close')
                        .setColor(config.embedColor)
                        .setDescription(`Closed ${processCount > 0 ? 'all open' : 'no'} Roblox UWPs`);

                    message.channel.send({ embeds: [embed] });
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setTitle('Close')
                        .setColor(config.embedColor)
                        .setDescription('No Roblox UWPs are currently running.');

                    message.channel.send({ embeds: [embed] });
                }
            } catch (error) {
                console.error('Error executing taskkill:', error);
                message.reply('An error occurred while closing processes.');
            }
        }

        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function autoClose() {
            try {
                const timeoutInSeconds = config.autoCloseInterval;
                const timeoutInMilliseconds = timeoutInSeconds * 1000;

                await delay(timeoutInMilliseconds);

                const { stdout, stderr } = await exec('taskkill /F /IM Windows10Universal.exe 2>nul');

                if (stdout.includes('SUCCESS')) {
                    console.log(colors.green('[CLOSE]: Closed all running Roblox'));
                } else {
                    console.log(colors.green('[CLOSE]: Closed all running Roblox'));
                }
            } catch (error) {
                console.log(colors.green('[CLOSE]: Closed all running Roblox'));
            }
        }

        async function closeAllPrograms(message, userId) {
            if (message.author.id !== userId) {
                return;
            }

            const embed = new Discord.MessageEmbed()
                .setTitle('Program Close')
                .setColor(config.embedColor);

            try {
                const command = 'taskkill /F /IM *';
                const { stdout } = await exec(command);

                const closedPrograms = stdout.toString().trim().split('\n').length;

                if (closedPrograms > 1) {
                    embed.setDescription(`Successfully closed ${closedPrograms} program(s).`);
                } else {
                    embed.setDescription('No programs were closed.');
                }
            } catch (error) {
                console.error(`Error closing programs: ${error}`);
                embed.setDescription('Error closing programs. Please try again.');
            }

            try {
                await message.channel.send({ embeds: [embed] });
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
        async function displayProcesses(message, userId) {
            if (message.author.id === userId) {
                const windows = listOpenWindows();
                const filteredWindows = windows.filter(window => /^Roblox.*\d$/.test(window.caption));

                const uniqueCaptions = [];
                const uniqueWindows = filteredWindows.filter(window => {
                    if (uniqueCaptions.includes(window.caption)) {
                        return false;
                    }
                    uniqueCaptions.push(window.caption);
                    return true;
                });

                uniqueWindows.sort((a, b) => {
                    const numberA = parseInt(a.caption.match(/\d+$/)[0]);
                    const numberB = parseInt(b.caption.match(/\d+$/)[0]);
                    return numberA - numberB;
                });

                const instanceNumber = config.instanceNumber;
                const processesRows = config.processesRows;

                const columns = instanceNumber > 50 ? 4 : 2;
                const rows = Math.ceil(instanceNumber / columns);

                let description = '';

                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < columns; col++) {
                        const index = col * rows + row;
                        if (index >= instanceNumber) break;

                        const i = index + 1;
                        const caption = instanceNumber > 50 ? `${i < 10 ? '' : ''}${i}` : `Roblox ${i < 10 ? '' : ''}${i}`;
                        const found = uniqueWindows.some(window => window.caption === caption || window.caption === `Roblox ${i}`);
                        const status = found ? '\u{1F7E9}' : '\u{1F7E5}';

                        description += `${i < 10 ? ' ' : ''}[${caption}]: ${status} `;
                    }
                    description += '\n';
                }

                if (description === '') {
                    description = 'No Roblox found.';
                }

                const embed = new Discord.MessageEmbed()
                    .addFields({ name: 'Processes', value: '```ini\n' + description + '```' })
                    .setColor(config.embedColor);

                try {
                    if (description.length <= 1024) {
                        await message.channel.send({ embeds: [embed] });
                    } else {
                        const chunkSize = Math.ceil(description.length / rows);
                        const chunks = splitDescriptionIntoChunks(description, chunkSize);

                        for (const chunk of chunks) {
                            const chunkEmbed = new Discord.MessageEmbed()
                                .addFields({ name: 'Processes', value: '```ini\n' + chunk + '```' })
                                .setColor(config.embedColor);
                            await message.channel.send({ embeds: [chunkEmbed] });
                        }
                    }
                } catch (error) {
                    console.error('Failed to send message:', error);
                }
            } else {
            }
        }

        function splitDescriptionIntoChunks(description, chunkSize) {
            const chunks = [];
            const lines = description.split('\n');
            let currentChunk = '';
            let charCount = 0;
            for (const line of lines) {
                if (charCount + line.length + 1 > chunkSize) {
                    chunks.push(currentChunk);
                    currentChunk = '';
                    charCount = 0;
                }
                currentChunk += line + '\n';
                charCount += line.length + 1;
            }
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            return chunks;
        }

        async function removeAccount(message, userId) {
            if (message.author.id !== userId) {
                return;
            }

            const args = message.content.split(' ');
            const command = args[0];
            const username = args[1];

            try {
                let accounts = JSON.parse(await fs.readFile('accounts.json', 'utf8'));
                const removedAccountIndex = accounts.findIndex((account) => account.Username === username);
                if (removedAccountIndex === -1) {
                    message.channel.send('Account not found.');
                    return;
                }

                const removedAccount = accounts.splice(removedAccountIndex, 1)[0];

                let raAccounts = JSON.parse(await fs.readFile('./ASSETS/ra.json', 'utf8'));
                raAccounts.push(removedAccount);

                await fs.writeFile('accounts.json', JSON.stringify(accounts, null, 2));
                await fs.writeFile('./ASSETS/ra.json', JSON.stringify(raAccounts, null, 2));

                message.channel.send(`Account "${username}" removed and moved to ra.json.`);
            } catch (error) {
                console.error('Error:', error);
            }
        }
        async function addAccount(message, userId) {
            if (message.author.id !== userId) {
                return;
            }

            const args = message.content.split(' ');
            const command = args[0];
            const accountName = args[1];

            try {
                let raAccounts = JSON.parse(await fs.readFile('./ASSETS/ra.json', 'utf8'));
                const addedAccount = raAccounts.find((account) => account.Username === accountName);

                if (!addedAccount) {
                    message.channel.send('Account not found in ra.json.');
                    return;
                }

                raAccounts = raAccounts.filter((account) => account !== addedAccount);

                let accounts = JSON.parse(await fs.readFile('../accounts.json', 'utf8'));
                accounts.push(addedAccount);

                await fs.writeFile('./ASSETS/ra.json', JSON.stringify(raAccounts, null, 2));
                await fs.writeFile('../accounts.json', JSON.stringify(accounts, null, 2));

                message.channel.send(`Account "${accountName}" added back to accounts.json.`);
            } catch (error) {
                console.error('Error:', error);
            }
        }
        async function sendHelpEmbed(message, userId) {
            if (message.author.id === userId) {
                const { channel } = message;

                try {
                    const currentDate = new Date().toLocaleDateString();
                    const embed = {
                        color: config.embedColor,
                        footer: {
                            text: `${botversion} \u2022 ${currentDate}`,
                        },

                        description: '**Commands**\n```ini\n' +
                            '[stats, pcstats, ps]: Shows CPU and Ram Usage\n' +
                            '[accounts, al]: Shows loaded accounts\n' +
                            '[settings]: CTPB Settings\n' +
                            '[shutdownpc, sp]: Shuts down your PC\n' +
                            '[restartbot, reb]: Restarts CTP bot\n' +
                            '[robux, rbx]: Shows ROBUX amount\n' +
                            // '[displayname, dn]: Changes all Accounts DisplayName (Coming Soon)\n' +
                            '[launch]: Launches a UWP Roblox straight into PLS DONATE\n' +
                            '[launchall, la]: Launches all instances to specified PlaceID\n' +
                            '[close]: Closes all UWP Roblox\n' +
                            '[removeaccount, ra, remove]: Removes a specific account\n' +
                            '[addaccount, aa, add]: Adds a account\n' +
                            '[processes, as]: Shows all running UWP processes\n' +
                            // '[transfer]: Transfer Robux to one account (Coming Soon)\n' +
                            '[top]: Robux leaderboard\n' +
                            '[screenshot, sc]: Shows a screenshot of your desktop\n' +
                            '[installuwp, iuwp]: Launches UWP Installer\n' +
                            '[getrobloxids, gri]: Important part of the setup, this gets all UWP ids in order for [autolaunch], [launch], [launchall] to work\n' +
                            `[massconfig, mc]: Updates autoexec and workspace folders from all UWP instances with the changes you've made from ./workspace and ./autoexec\n` +
                            `[cookies]: Dms you a list of all your cookies\n` +
                            `[listinstancesaccounts, lia]: Shows accounts logged in to a instance\n` +

                            '[help]: Shows bot commands' +
                            '```' +
                            '**Config**' +
                            '```ini\n' +
                            '[Cleaner]: Cleans unnecessary files that fills your disk\n' +
                            '[AutoInject]: Automatically injects fluxus, you must be using our custom APPX and must always use that folder, you cannot use another CTP folder. If you wish to upgrade then delete/move the files from the folder except APPX and paste in new files\n' +
                            '[AutoLaunch]: Automatically launches all instances, it automatically relaunches them too\n' +
                            '[AduritePricing]: If you use Adurite to sell robux then keep this true, if you are using another site to sell your robux set this to false and change [customPricing] value\n' +
                            `[USDStatus]: Displays the USD conversion on bot's status\n` +
                            `[AutoClose]: Automatically closes all roblox with your specified time at [autoCloseInterval]\n` +
                            '[AutoLocateFluxus]: If you are having issues with AutoInject or your using a custom APPX, set this to false and manually define the paths on [ASSETS/aeconfig.ini]\n' +
                            `[EmbedColor]: Embed's Color, must be a HEX Value\n` +
                            `[PlaceId]: Defines which game it will join\n` +
                            '[InstanceNumber]: Defines how much instances you will be using\n' +
                            `[CustomPricing]: If you don't use Adurite, change this\n` +
                            `[ProcessesRows]: Defines how much rows the command [processes] should use\n` +
                            `[CleanFilesDelay]: Delay between each cleaning\n` +
                            `[LaunchDelay]: Delay between each launch, this affects [launch], and [launchall]\n` +
                            `[InjectDelay]: Delay before it injects\n` +
                            `[InjectTimeout]: Delay before it stops injecting\n` +
                            `[AutoCloseInterval]: Delay between each close, (2-3 hours is recommended unless you have a huge launch delay)\n` +
                            `[CTPB]: Theme` +
                            '```',
                    };

                    await channel.send({ embeds: [embed] });
                } catch (error) {
                    console.error('Failed to send the help embed:', error);
                }
            } else {
            }
        }

        async function sendTopUsers(message, userId) {
            if (message.author.id !== userId) {
                return;
            }

            try {
                const [data, aduriteValue] = await Promise.all([
                    fetch('https://profit.tspon.co/top').then(response => response.json()),
                    axios.get('https://adurite.tspon.co').then(response => response.data)
                ]);

                if (!data || !data.top || aduriteValue === undefined) {
                    throw new Error('Invalid data format or Adurite value is undefined.');
                }

                const topUsers = data.top;
                const embed = new Discord.MessageEmbed().setColor(config.embedColor).setTitle('Profit Leaderboard');
                const sortedUsers = Object.entries(topUsers).sort((a, b) => b[1] - a[1]);
                const topUsersWithProfit = sortedUsers.slice(0, 5);

                const fields = topUsersWithProfit.map(([userID, profit], index) => {
                    const aduriteAmount = Math.floor(profit / 1000) * Number(aduriteValue);
                    return {
                        name: `#${index + 1}`,
                        value: `User: <@${userID}>\nProfit: R$${profit}\nAdurite Value: $${aduriteAmount.toFixed(2)}`,
                        inline: false,
                    };
                });

                if (fields.length === 0) {
                    message.channel.send('No data available.');
                } else {
                    embed.addFields(fields);
                    message.channel.send({ embeds: [embed] });
                }
            } catch (error) {
                console.error(error);
                message.channel.send('An error occurred while fetching or processing the data.');
            }
        }
        async function installUWP(message, userId) {
            if (message.author.id !== userId) {
                return;
            }

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            const embed = {
                color: config.embedColor,
                description: '```Check Console```'
            };

            message.reply({ embeds: [embed] });

            function questionAsync(question) {
                return new Promise((resolve) => {
                    rl.question(question, (answer) => resolve(answer));
                });
            }

            try {
                const install_range = await questionAsync(colors.green('[UWP]: ' + colors.white('How many UWPs do you want to install? (e.g. 1-20): ')));

                const [start, end] = install_range.split('-').map((val) => parseInt(val.trim(), 10));

                const manifest_folder = '../APPX/AppxManifest';
                const manifest_file = '../APPX/AppxManifest.xml';
                const powershell_cmd = `Powershell.exe Add-AppxPackage -Register ./${manifest_file}`;

                for (let i = start; i <= end; i++) {
                    const manifest_file_num = `${manifest_folder}/${i}.xml`;
                    console.log(colors.green(`[UWP]: `) + colors.white(`Installing `) + colors.blue(`Roblox ${i}`));
                    await copyFile(manifest_file_num, manifest_file);
                    await executeCommandAsync(powershell_cmd);
                    console.log("[UWP]: Installed!".green);
                }

                console.log('[UWP]: Updating instanceNumber...'.green);
                const configPath = './config.json';
                const configData = await readFile(configPath, 'utf-8');
                const config = JSON.parse(configData);
                config.instanceNumber = end;
                await writeFile(configPath, JSON.stringify(config, null, 2));
            } catch (error) {
                console.error('[UWP]: An error occurred:'.red, error);
            } finally {
                rl.close();
            }
        }

        async function executeCommandAsync(command) {
            return new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(stdout);
                    }
                });
            });
        }

        let cachedData = null;

        async function cookiesDM(message, userId) {
            if (message.author.id !== userId) return;

            try {
                if (cachedData === null) {
                    const data = await fs.promises.readFile('generated.txt', 'utf8');
                    cachedData = data.split('\n');
                }

                const lines = cachedData;
                const cookies = [];

                for (let i = 1; i < lines.length; i += 2) {
                    const cookie = lines[i].trim();
                    cookies.push(cookie);
                }

                const writeStream = fs.createWriteStream('cookies.txt');
                writeStream.write(cookies.join('\n'));
                writeStream.end();

                const user = await message.client.users.fetch(userId);

                const readStream = fs.createReadStream('./cookies.txt');
                await user.send({
                    files: [{
                        attachment: readStream,
                        name: 'cookies.txt'
                    }]
                });

                const embed = {
                    color: config.embedColor,
                    description: '```Check your DMs```'
                };

                message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error:', error);
                message.channel.send('An error occurred while extracting cookies.');
            }
        }

        // Commands Object
        const commands = {
            stats: getStats,
            pcstats: getStats,
            ps: getStats,
            settings: changePrefix,
            accounts: sendAccountsEmbed,
            al: sendAccountsEmbed,
            shutdownpc: shutdownPC,
            sp: shutdownPC,
            robux: fetchRobux,
            rbx: fetchRobux,
            launch: launchRobloxCommand,
            launchall: launchAllRoblox,
            la: launchAllRoblox,
            close: closeProcesses,
            processes: displayProcesses,
            as: displayProcesses,
            clos: closeAllPrograms,
            removeaccount: removeAccount,
            ra: removeAccount,
            remove: removeAccount,
            addaccount: addAccount,
            aa: addAccount,
            add: addAccount,
            help: sendHelpEmbed,
            top: sendTopUsers,
            screenshot: takeScreenshot,
            sc: takeScreenshot,
            getrobloxids: getRobloxIds,
            getrbxids: getRobloxIds,
            gri: getRobloxIds,
            massconfig: massConfig,
            mc: massConfig,
            clearrbxids: clearRbxIds,
            cri: clearRbxIds,
            installuwp: installUWP,
            iuwp: installUWP,
            restartbot: restartBot,
            reb: restartBot,
            cookies: cookiesDM,
            listinstanceaccounts: readInstances,
            lia: readInstances,
        };

        // Command Execution
        client.on('messageCreate', async (message) => {
            if (message.author.bot) {
                return;
            }

            const configPath = './config.json';
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            const prefix = config.PREFIX;
            const userId = config.USER_ID;

            if (message.content.startsWith(prefix)) {
                const args = message.content.slice(prefix.length).trim().split(/ +/);
                const command = args.shift().toLowerCase();

                if (commands.hasOwnProperty(command)) {
                    console.log(
                        colors.cyan(`[CTPB]: `) +
                        colors.green(`${message.member.displayName} `) +
                        colors.white(`ran ${command}`)

                    );
                    commands[command](message, userId, ...args);
                }
            }
        });

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;

            if (interaction.customId === 'prefix_button') {
                if (interaction.user.id !== config.USER_ID) {
                }

                interaction.reply('Please enter the new prefix in chat.');

                const filter = (m) => m.author.id === config.USER_ID && !m.author.bot;
                const collector = interaction.channel.createMessageCollector(filter, { time: 30000, max: 1 });

                collector.on('collect', (m) => {
                    if (m.author.id !== client.user.id) {
                        const newPrefix = m.content.trim();

                        if (config.PREFIX === newPrefix) {
                            m.channel.send(`Prefix is already "${newPrefix}"`);
                        } else {
                            config.PREFIX = newPrefix;

                            fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
                                if (err) {
                                    console.error('Error updating prefix in config:', err);
                                    return m.channel.send('An error occurred while updating the prefix. Please try again.');
                                }
                                console.log(colors.green('[SETTINGS]: ') + colors.white(`Prefix changed to "${newPrefix}"`));
                                m.channel.send(`Prefix has been updated to: ${newPrefix}`);
                            });
                        }

                        collector.stop();
                    }
                });

                collector.on('end', (collected) => {
                    if (collected.size === 0) {
                        interaction.followUp('Prefix change process cancelled.');
                    }
                });

                collector.on('error', (error) => {
                    console.error('Error during prefix change process:', error);
                    interaction.followUp('An error occurred during the prefix change process. Please try again.');
                });
            } else if (interaction.customId === 'clean_files_button') {
                if (interaction.user.id !== config.USER_ID) {
                }

                config.cleaner = !config.cleaner;
                fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
                    if (err) {
                        console.error('Error updating setting in config:', err);
                        return interaction.reply('An error occurred while updating the setting. Please try again.');
                    }

                    const status = config.cleaner ? colors.green('enabled') : colors.red('disabled');
                    const replyStatus = config.cleaner ? 'enabled' : 'disabled';

                    console.log(colors.green('[SETTINGS]: ') + colors.white(`Clean Files ${status}`));
                    interaction.reply(`Clean Files setting has been ${replyStatus}.`);
                });
            } else if (interaction.customId === 'toggle_al_button') {
                if (interaction.user.id !== config.USER_ID) {
                }

                config.autoLaunch = !config.autoLaunch;
                fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
                    if (err) {
                        console.error('Error updating setting in config:', err);
                        return interaction.reply('An error occurred while updating the setting. Please try again.');
                    }

                    const status = config.autoLaunch ? colors.green('enabled') : colors.red('disabled');
                    const replyStatus = config.autoLaunch ? 'enabled' : 'disabled';

                    console.log(colors.green('[SETTINGS]: ') + colors.white(`Auto Launch ${status}`));
                    interaction.reply(`Auto Launch setting has been ${replyStatus}.`);
                });
            } else if (interaction.customId === 'toggle_apricing_button') {
                if (interaction.user.id !== config.USER_ID) {
                }
                config.aduritePricing = !config.aduritePricing;
                fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
                    if (err) {
                        console.error('Error updating setting in config:', err);
                        return interaction.reply('An error occurred while updating the setting. Please try again.');
                    }

                    const status = config.aduritePricing ? colors.green('enabled') : colors.red('disabled');
                    const replyStatus = config.aduritePricing ? 'enabled' : 'disabled';

                    console.log(colors.green('[SETTINGS]: ') + colors.white(`Adurite Pricing ${status}`));
                    interaction.reply(`Adurite Pricing setting has been ${replyStatus}.`);
                });
            }
        });
        function readAccountsFile() {
            try {
                const accountsData = fs.readFileSync('../accounts.json', 'utf8');
                return JSON.parse(accountsData);
            } catch (error) {
                console.error('Error reading accounts file:', error);
                return [];
            }
        }

        client.login(config.TOKEN);

    }

})();