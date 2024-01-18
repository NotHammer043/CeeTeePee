from keyauth import api
import sys
import time
import platform
import os
import hashlib
from time import sleep
from datetime import datetime
from flask import Flask

if sys.version_info.minor < 10:
    print("[Security] - Python 3.10 or higher is recommended. The bypass will not work on 3.10+")
    print("You are using Python {}.{}".format(sys.version_info.major, sys.version_info.minor))

if platform.system() == 'Windows':
    os.system('cls & title CTP - V1.0')
elif platform.system() == 'Linux':
    os.system('clear')
    sys.stdout.write("\x1b]0;CTP - V1.0\x07")
elif platform.system() == 'Darwin':
    os.system("clear && printf '\e[3J'")
    os.system('''echo - n - e "\033]0;CTP - V1.0\007"''')

print("Initializing")


def getchecksum():
    md5_hash = hashlib.md5()
    file = open(''.join(sys.argv), "rb")
    md5_hash.update(file.read())
    digest = md5_hash.hexdigest()
    return digest


keyauthapp = api(
    name = "CTP",
    ownerid = "EfoWPOoL7e",
    secret = "227b37feeea9799ac08dc2b48a657f2b2d91f9fedba401db96e94c59a5ccb3e9",
    version = "1.0",
    hash_to_check = getchecksum()
)

print(f"""
Number of users: {keyauthapp.app_data.numUsers}
Number of online users: {keyauthapp.app_data.onlineUsers}
Number of keys: {keyauthapp.app_data.numKeys}
""")
print(f"Current Session Validation Status: {keyauthapp.check()}")
print(f"Blacklisted? : {keyauthapp.checkblacklist()}")


def answer():
    try:
        print("""
1. Login
2. Register
        """)
        ans = input("Select Option: ")
        if ans == "1":
            print("\nLog In")
            user = input('Username: ')
            password = input('Password: ')
            keyauthapp.login(user, password)
        elif ans == "2":
            print("\nRegister")
            user = input('Username: ')
            password = input('Password: ')
            print("\n(Sent to your dms, CTPUser__)")
            license = input('License: ')
            keyauthapp.register(user, password, license)
        else:
            print("\nInvalid Option!")
            time.sleep(1)
            os.system('cls')
            answer()
    except KeyboardInterrupt:
        os._exit(1)



answer()

import os
import json
import time
import requests
import robloxapi
import asyncio
from flask import Flask, redirect, render_template, jsonify, request

app = Flask(__name__)

parent_dir = os.path.dirname(os.getcwd())
config = json.load(open(os.path.join(parent_dir, 'utils', 'config.json')))
file = json.load(open(os.path.join(parent_dir, 'utils', 'accounts.json')))

async def copy_avatar(user, copy):
    client = robloxapi.Client()
    await client.login(cookie=user["Cookie"])
    try:
        copy = int(copy)
    except ValueError:
        copy = await client.get_user_id_by_username(copy)
    outfit = await client.get_outfit(copy)

    try:
        await client.set_avatar_scales(
            outfit.scales.height,
            outfit.scales.width,
            outfit.scales.head,
            outfit.scales.depth,
            outfit.scales.proportion,
            outfit.scales.body_type
        )
        print("Copied scaling")
    except:
        print("Failed to copy scaling")

    try:
        await client.set_player_avatar_type(outfit.player_avatar_type)
        print("Copied type")
    except:
        print("Failed to copy type")

    try:
        await client.set_avatar_body_colors(
            outfit.body_colors.head_color_id,
            outfit.body_colors.torso_color_id,
            outfit.body_colors.right_arm_color_id,
            outfit.body_colors.left_arm_color_id,
            outfit.body_colors.right_leg_color_id,
            outfit.body_colors.left_leg_color_id
        )
        print("Copied colors")
    except:
        print("Failed to copy colors")

    await client.set_wearing_assets([])
    for asset in outfit.assets:
        try:
            if not await client.has_asset(user_id=user["UserID"], asset_id=asset.id, asset_type="Asset"):
                await client.buy_asset(asset.id)
            await client.wear_asset(asset.id)
            print(f"Wore {asset.name}")
        except:
            print(f"Failed to wear {asset.name}")

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/update-config', methods=['POST'])
def update_config():
    print("Received POST request to update configuration")
    new_config = request.json
    print(f"New configuration: {new_config}")

    file_path = os.path.join(os.path.dirname(__file__), '..', 'utils', 'botjs', 'BotjsConfig.json')
    print(f"Config file path: {file_path}")
    
    try:
        with open(file_path) as f:
            old_config = json.load(f)
        print(f"Old configuration: {old_config}")
    except Exception as e:
        print(f"Error loading config file: {e}")
        return "Failed to load configuration"

    for key, value in new_config.items():
        old_config[key] = value

    try:
        with open(file_path, 'w') as f:
            json.dump(old_config, f)
        print("Configuration successfully saved")
    except Exception as e:
        print(f"Error writing config file: {e}")
        return "Failed to save configuration"

    return 'Configuration saved'

@app.route('/update')
def update():
    total = []
    pendingTotal = []
    for x in file:
        if x['Username'] == config['mainAccount']:
            total.append(0)
            pendingTotal.append(0)
            continue
        try:
            current = requests.get('https://economy.roblox.com/v1/user/currency', headers={'Cookie': '.ROBLOSECURITY=' + x['Cookie']}).json()
            pending = requests.get(f'https://economy.roblox.com/v2/users/{x["UserID"]}/transaction-totals?timeFrame=Week&transactionType=summary', headers={'Cookie': '.ROBLOSECURITY=' + x['Cookie']}).json()
            total.append(current['robux'])
            pendingTotal.append(pending['pendingRobuxTotal'])
        except Exception as e:
            print(f"{x['Username']}: Error {e}")
            total.append(0)
            pendingTotal.append(0)

    totalAdded = sum(total)
    pendingTotalAdded = sum(pendingTotal)
    allTotal = totalAdded + pendingTotalAdded
    afterTransfer = round(allTotal * 0.7)
    time.sleep(1)
    return jsonify({'robux': allTotal, 'afterTransfer': afterTransfer})

@app.route('/accounts')
def accounts():
    return jsonify(file)

def block_user(cookie, user_id):
    client = robloxapi.client(cookie)
    user = client.get_user(user_id)
    if user:
        user.block()
        print(f"Blocked {user_id}")
    else:
        print(f"Failed to block {user_id} or user is already blocked")

@app.route('/block/<int:user_id>')
def block(user_id):
    for x in file:
        if x['Username'] == config['mainAccount']:
            continue
        block_user(x['Cookie'], user_id)
    return f"Blocked {user_id} on all accounts"

@app.route('/copy-avatar/<string:username>/<string:copy>')
def copy_avatar_route(username, copy):
    user = next((acc for acc in file if acc["Username"] == username), None)
    if user is None:
        return jsonify({'error': 'User not found in accounts.json'})
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(copy_avatar(user, copy))
    loop.close()
    return jsonify({'success': True})

@app.route('/update-display-name/<string:username>', methods=['POST'])
def update_display_name(username):
    display_name = request.form['display_name']
    for account in file:
        if account['Username'] == username:
            account['DisplayName'] = display_name
            with open(os.path.join(parent_dir, 'utils', 'accounts.json'), 'w') as f:
                json.dump(file, f, indent=2)
            break
    return redirect(f'/manage-account/{username}')

import logging
import socket

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

hostname = socket.gethostname()
ip_address = socket.gethostbyname(hostname)
print(f"Port: 8080")
print(f"URL: http://{ip_address}:8080\n")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)