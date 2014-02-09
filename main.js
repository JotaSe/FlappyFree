var DEBUG = false;
var SPEED = 200;
var GRAVITY = 16;
var FLAP = 315;
var SPAWN_RATE = 1 / 1.2;
var OPENING = 144;
var NUM_BULLETS = 1;


WebFontConfig = {
    google: {families: ['Press+Start+2P::latin']},
    active: main
};
(function() {
    var wf = document.createElement('script');
    var fb = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
            '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';

    fb.src = ('https:' == document.location.protocol ? 'https' : 'http') +
            '://connect.facebook.net/en_US/all.js';
    fb.type = 'text/javascript';
    fb.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
    s.parentNode.insertBefore(fb, s);
})();


function main() {

    var state = {
        preload: preload,
        create: create,
        update: update,
        render: render
    };

    var parent = document.querySelector('#screen');

    var game = new Phaser.Game(
            0,
            0,
            Phaser.CANVAS,
            parent,
            state,
            false,
            false
            );

    function preload() {
        var assets = {
            spritesheet: {
                birdie: ['assets/turpial.png', 24, 24],
                clouds: ['assets/dollars.png', 256, 128]
            },
            image: {
                finger: ['assets/maduro.png'],
                fence: ['assets/fencePeople.png'],
                bullet: ['assets/bullet.png'],
                harina: ['assets/harina.png'],
                cap: ['assets/cap.png'],
                fondo: ['assets/background.png'],
                bonus: ['assets/bonus.png']

            },
            audio: {
                flap: ['assets/flapping.wav'],
                score: ['assets/winning.wav'],
                hurt: ['assets/hit.wav'],
                bonusSound: ['assets/bonus.wav']
            }
        };
        Object.keys(assets).forEach(function(type) {
            Object.keys(assets[type]).forEach(function(id) {
                game.load[type].apply(game.load, [id].concat(assets[type][id]));
            });
        });
    }

    var gameStarted,
            gameOver,
            score,
            bg,
            credits,
            clouds,
            fingers,
            invs,
            birdie,
            bullets,
            _bonus,
            fence,
            _background,
            scoreText,
            instText,
            gameOverText,
            flapSnd,
            scoreSnd,
            hurtSnd,
            bonusSnd,
            fingersTimer,
            cloudsTimer,
            bulletsTimer,
            bonusTimer;

    function create() {
        // Set world dimensions
        var screenWidth = parent.clientWidth > window.innerWidth ? window.innerWidth : parent.clientWidth;
        var screenHeight = parent.clientHeight > window.innerHeight ? window.innerHeight : parent.clientHeight;
        game.world.width = screenWidth;
        game.world.height = screenHeight;
        // Draw bg
        bg = game.add.graphics(0, 0);
        bg.beginFill(0xDDEEFF, 1);
        bg.drawRect(0, 0, game.world.width, game.world.height);
        bg.endFill();
        // add background
        _background = game.add.tileSprite(0, -230, game.world.width, game.world.height + 230, 'fondo');
        _background.tileScale.setTo(1, 1);
        // Credits 'yo
        credits = game.add.text(
                game.world.width / 2,
                10,
                'Potu apps\n Basado en el juego Flappy Bird',
                {
                    font: '8px "Press Start 2P"',
                    fill: '#000',
                    align: 'center'
                }
        );
        credits.anchor.x = 0.5;

        // Add clouds group
        clouds = game.add.group();

        // Add bullets
        bullets = game.add.group();
        //Add bonus
        _bonus = game.add.group();
        // Add fingers
        fingers = game.add.group();
        // Add invisible thingies
        invs = game.add.group();
        // Add birdie

        birdie = game.add.sprite(0, 0, 'birdie');
        birdie.anchor.setTo(0.5, 0.5);
        birdie.animations.add('fly', [0, 1, 2, 3, 4], 10, true);
        birdie.inputEnabled = true;
        birdie.body.collideWorldBounds = true;
        birdie.body.gravity.y = GRAVITY;

        // Add fence
        fence = game.add.tileSprite(0, game.world.height - 32, game.world.width, 32, 'fence');
        fence.tileScale.setTo(2, 2);
        // Add score text
        scoreText = game.add.text(
                game.world.width / 2,
                game.world.height / 4,
                "",
                {
                    font: '10px "Press Start 2P"',
                    fill: '#fff',
                    stroke: '#430',
                    strokeThickness: 4,
                    align: 'center'
                }
        );


        scoreText.anchor.setTo(0.5, 0.5);
        // Add instructions text
        instText = game.add.text(
                game.world.width / 2,
                game.world.height - game.world.height / 4,
                "",
                {
                    font: '8px "Press Start 2P"',
                    fill: '#fff',
                    stroke: '#430',
                    strokeThickness: 4,
                    align: 'center'
                }
        );
        instText.anchor.setTo(0.5, 0.5);
        // Add game over text
        gameOverText = game.add.text(
                game.world.width / 2,
                game.world.height / 2,
                "",
                {
                    font: '10px "Press Start 2P"',
                    fill: '#fff',
                    stroke: '#430',
                    strokeThickness: 4,
                    align: 'center'
                }
        );
        gameOverText.anchor.setTo(0.5, 0.5);
        gameOverText.scale.setTo(2, 2);
        // Add sounds
        flapSnd = game.add.audio('flap');
        scoreSnd = game.add.audio('score');
        hurtSnd = game.add.audio('hurt');
        bonusSnd = game.add.audio('bonusSound');
        // Add controls
        game.input.onDown.add(flap);
        // Start clouds timer
        cloudsTimer = new Phaser.Timer(game);
        cloudsTimer.onEvent.add(spawnCloud);
        cloudsTimer.start();
        cloudsTimer.add(Math.random());
        // RESET!
        reset();
    }

    function reset() {
        gameStarted = false;
        gameOver = false;
        score = 0;
        credits.renderable = true;
        scoreText.setText("FLAPPY\nFREE");
        instText.setText("TOCA PARA ALEAR\nLAS ALAS DEL PAJARO");
        gameOverText.renderable = false;
        birdie.body.allowGravity = false;
        birdie.angle = 0;
        birdie.reset(game.world.width / 4, game.world.height / 2);
        birdie.scale.setTo(2, 2);
        birdie.animations.play('fly');
        fingers.removeAll();
        invs.removeAll();
        bullets.removeAll();
        _bonus.removeAll();
        //share();

    }

    function start() {
        credits.renderable = false;
        birdie.body.allowGravity = true;
        // SPAWN FINGERS!
        fingersTimer = new Phaser.Timer(game);
        fingersTimer.onEvent.add(spawnFingers);
        fingersTimer.start();
        fingersTimer.add(2);
        //Spawn bullets
        bulletsTimer = new Phaser.Timer(game);
        bulletsTimer.onEvent.add(spawnBullets);
        bulletsTimer.start();
        bulletsTimer.add(1);
        //Spawn Bonus
        bonusTimer = new Phaser.Timer(game);
        bonusTimer.onEvent.add(spawnBonus);
        bonusTimer.start();
        bonusTimer.add(20);

        // Show score
        scoreText.setText(score);
        instText.renderable = false;
        // START!
        gameStarted = true;
    }

    function flap() {
        if (!gameStarted) {
            start();
        }
        if (!gameOver) {
            birdie.body.velocity.y = -FLAP;
            flapSnd.play();
        }
    }

    function spawnCloud() {
        cloudsTimer.stop();

        var cloudY = Math.random() * game.height / 2;
        var cloud = clouds.create(
                game.width,
                cloudY,
                'clouds',
                Math.floor(4 * Math.random())
                );
        var cloudScale = 0.8 * Math.random();
        cloud.alpha = 1 / (cloudScale + 1);
        cloud.scale.setTo(cloudScale, cloudScale);
        cloud.body.allowGravity = false;
        cloud.body.velocity.x = -SPEED / (cloudScale + 1);
        cloud.anchor.y = 0;

        cloudsTimer.start();
        cloudsTimer.add(4 * Math.random());
    }

    function o() {
        return OPENING + 60 * ((score > 50 ? 50 : 50 - score) / 50);
    }
    function spawnBonus()
    {
        bonusTimer.stop();

        var bulletY = Math.random() * (game.height - 60) + 60;

        getBonus(bulletY, 1.5);
        bonusTimer.start();
        bonusTimer.add(1 / SPAWN_RATE * 3);

    }
    function getBonus(bulletY, _speed)
    {

        var bonus = _bonus.create(
                game.width,
                bulletY + o() / 2,
                'bonus'
                );
        bonus.body.allowGravity = false;

        // Flip finger! *GASP*
        bonus.scale.setTo(1, 1);
        bonus.body.offset.y = 1;

        // Move to the left
        bonus.body.velocity.x = -SPEED * _speed;

        return bonus;
    }
    function spawnBullets()
    {
        bulletsTimer.stop();
        var speed;

        //var bulletY = ((game.height - 16 - o() / 2) / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
        // Bottom finger
        bulletY = Math.random() * (game.height - 60) + 60;
        if (score > 10 && score < 20)
        {
            speed = 1.1;
        }
        else
        if (score > 20 && score < 25)
        {
            speed = 1.3;
        }
        else
        if (score > 25 && score < 35)
        {
            speed = 1.5;
        }
        if (score > 35)
        {
            speed = 1.7;
        }

        // Top finger (flipped)
        // var topFinger = spawnFinger(fingerY, true);

        // Add invisible thingy
        /*  var inv = invs.create(topFinger.x + topFinger.width, 0);
         inv.width = 2;
         inv.height = game.world.height;
         inv.body.allowGravity = false;
         inv.body.velocity.x = -SPEED;*/
        var _bullet = getBullet(bulletY, speed);
        bulletsTimer.start();
        bulletsTimer.add(1 / SPAWN_RATE * 1.2);

    }
    function getBullet(bulletY, _speed)
    {
        var sprite;
        var rand = parseInt((Math.random() * (4 - 1) + 1));
//        console.log(rand);
        switch (rand)
        {
            case 1:
                sprite = 'bullet';
                break;
            case 2:
                sprite = 'harina';
                break;
            case 3:
                sprite = 'cap';
                break;
        }
        var bullet = bullets.create(
                game.width,
                bulletY + o() / 2,
                sprite
                );
        bullet.body.allowGravity = false;

        // Flip finger! *GASP*
        bullet.scale.setTo(1, 1);
        bullet.body.offset.y = 1;

        // Move to the left
        bullet.body.velocity.x = -SPEED * _speed;

        return bullet;
    }
    function spawnFinger(fingerY, flipped) {
        var finger = fingers.create(
                game.width,
                fingerY + (flipped ? -o() : o()) / 2,
                'finger'
                );
        finger.body.allowGravity = false;

        // Flip finger! *GASP*
        finger.scale.setTo(2, flipped ? -2 : 2);
        finger.body.offset.y = flipped ? -finger.body.height * 2 : 0;

        // Move to the left

        finger.body.velocity.x = -SPEED;

        return finger;
    }

    function spawnFingers() {
        fingersTimer.stop();

        var fingerY = ((game.height - 16 - o() / 2) / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * game.height / 6;
        // Bottom finger
        var botFinger = spawnFinger(fingerY);
        // Top finger (flipped)
        var topFinger = spawnFinger(fingerY, true);

        // Add invisible thingy
        var inv = invs.create(topFinger.x + topFinger.width, 0);
        inv.width = 2;
        inv.height = game.world.height;
        inv.body.allowGravity = false;
        inv.body.velocity.x = -SPEED;

        fingersTimer.start();
        var speed;
        if (score > 10 && score < 20)
        {
            speed = 1.1;
        }
        else
        if (score > 20 && score < 25)
        {
            speed = 1.3;
        }
        else
        if (score > 25 && score < 35)
        {
            speed = 1.5;
        }
        if (score > 35)
        {
            speed = 1.7;
        }
        else
            speed = 1;
        fingersTimer.add(1 / SPAWN_RATE * speed);
    }

    function addScore(_, inv) {
        invs.remove(inv);
        score += 1;
        scoreText.setText(score + " Millonas");
        scoreSnd.play();

    }
    function addScoreBonus(_, bonus)
    {
        _bonus.remove(bonus);
        score += 1;
        scoreText.setText(score + " Millonas");
        bonusSnd.play();
        _bonus.forEachAlive(function(bonus) {
            if (bonus.x + bonus.width < game.world.bounds.left) {
                bonus.kill();
            }
        });
    }

    function setGameOver() {
        gameOver = true;
        instText.setText("TOCA LA\nPANTALLA\nPARA VOLVER\nA INTENTAR");
        instText.renderable = true;
        var hiscore = window.localStorage.getItem('hiscore');
        hiscore = hiscore ? hiscore : score;
        hiscore = score > parseInt(hiscore, 10) ? score : hiscore;
        window.localStorage.setItem('hiscore', hiscore);
        gameOverText.setText("GAMEOVER\n\nHIGHSCORE\n" + hiscore + " MILLONAS");
        gameOverText.renderable = true;
        // Stop all fingers
        fingers.forEachAlive(function(finger) {
            finger.body.velocity.x = 0;
        });
        invs.forEach(function(inv) {
            inv.body.velocity.x = 0;
        });
        // Stop all bullets
        fingers.forEachAlive(function(bullet) {
            bullet.body.velocity.x = 0;
        });
        //Stop bonus
        _bonus.forEachAlive(function(bonus) {
            bonus.body.velocity.x = 0;
        });
        bonusTimer.stop();
        // Stop spawning fingers
        fingersTimer.stop();
        //Stop Spawning bullets
        bulletsTimer.stop();
        // Make birdie reset the game
        game.input.onDown.addOnce(reset);
        hurtSnd.play();
    }

    function update() {
        if (gameStarted) {
            // Make birdie dive
            var dvy = FLAP + birdie.body.velocity.y;
            birdie.angle = (90 * dvy / FLAP) - 180;
            if (birdie.angle < -30) {
                birdie.angle = -30;
            }
            if (
                    gameOver ||
                    birdie.angle > 90 ||
                    birdie.angle < -90
                    ) {
                birdie.angle = 90;
                birdie.animations.stop();
                birdie.frame = 3;
            } else {
                birdie.animations.play('fly');
            }
            // Birdie is DEAD!
            if (gameOver) {
                if (birdie.scale.x < 4) {
                    birdie.scale.setTo(
                            birdie.scale.x * 1,
                            birdie.scale.y * 1
                            );
                }
                // Shake game over text
                gameOverText.angle = Math.random() * 5 * Math.cos(game.time.now / 100);
            } else {
                // Check game over
                game.physics.overlap(birdie, fingers, setGameOver);
                game.physics.overlap(birdie, bullets, setGameOver);
                if (!gameOver && birdie.body.bottom >= game.world.bounds.bottom) {
                    setGameOver();
                }
                // Add score
                game.physics.overlap(birdie, invs, addScore);
                game.physics.overlap(birdie, _bonus, addScoreBonus);
            }
            // Remove offscreen fingers
            fingers.forEachAlive(function(finger) {
                if (finger.x + finger.width < game.world.bounds.left) {
                    finger.kill();
                }
            });
            bullets.forEachAlive(function(bullet) {
                if (bullet.x + bullet.width < game.world.bounds.left) {
                    bullet.kill();
                }
            });
            _bonus.forEachAlive(function(bonus) {
                if (bonus.x + bonus.width < game.world.bounds.left) {
                    bonus.kill();
                }
            });
            // Update finger timer
            fingersTimer.update();
            bulletsTimer.update();
            bonusTimer.update();
        } else {
            birdie.y = (game.world.height / 2) + 8 * Math.cos(game.time.now / 200);
        }
        if (!gameStarted || gameOver) {
            // Shake instructions text
            instText.scale.setTo(
                    2 + 0.1 * Math.sin(game.time.now / 100),
                    2 + 0.1 * Math.cos(game.time.now / 100)
                    );
        }
        // Shake score text
        scoreText.scale.setTo(
                2 + 0.1 * Math.cos(game.time.now / 100),
                2 + 0.1 * Math.sin(game.time.now / 100)
                );
        // Update clouds timer
        cloudsTimer.update();
        // Remove offscreen clouds
        clouds.forEachAlive(function(cloud) {
            if (cloud.x + cloud.width < game.world.bounds.left) {
                cloud.kill();
            }
        });
        // Scroll fence
        if (!gameOver) {
            fence.tilePosition.x -= game.time.physicsElapsed * SPEED / 2;
            //_background.x -= game.time.physicsElapsed * SPEED / 3;
        }
    }

    function render() {
        if (DEBUG) {

            game.debug.renderSpriteBody(_background);
            game.debug.renderSpriteBody(birdie);
            fingers.forEachAlive(function(finger) {
                game.debug.renderSpriteBody(finger);
            });
            bullets.forEachAlive(function(bullet) {
                game.debug.renderSpriteBody(bullet);
            });
            invs.forEach(function(inv) {
                game.debug.renderSpriteBody(inv);
            });
            _bonus.forEachAlive(function(bonus) {
                game.debug.renderSpriteBody(bonus);
            });
        }
    }
    function share()
    {
        FB.ui({
            method: 'feed',
            link: 'https://developers.facebook.com/docs/dialogs/',
            caption: 'An example caption',
        }, function(response) {
        });

    }

}
;
