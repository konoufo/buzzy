var version = require('./package.json').version,
    express = require('express'),
    bodyParser = require('body-parser'),
    player = require('play-sound')(opts={}),
    app = express(),
    audio = false,
    locked = false,
    winner = null,
    noWords = /\W/;

process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.static('./public'));

function clear () { audio && audio.kill && audio.kill(); process.stdout.write('\033c'); }
function beep () { 
	audio = player.play('./music/buzzer.mp3', {maxBuffer: 500 * 1024}, function(err){
		if (err && !err.killed) throw err;
    err && console.log(err);
	}); 
	process.stdout.write('\x07'); };

// keyboard entry
process.stdin.on('data', function(key) {
  switch (key) {
    case '\u0003': process.exit(0); break; // ctrl+c
    case '\u001B': // esc
      clear();
      console.log('Ready…');
      winner = null;
      locked = false;
      audio = false;
      break;
    default:
      if (locked || noWords.test(key)) break;
      beep();
      clear();
      console.log('THE WINNER IS: ' + key);
      locked = true;
      winner = String(key);
  }
});

// HTTP POST entry
app.post('/', function(req, res){
  if (!req.body.name) return res.status(400).send('`name` body field required');
  if (locked) return res.send(winner);
  locked = true;
  winner = req.body.name;
  beep();
  clear();
  console.log('THE WINNER IS: ', req.body.name);
  res.send(winner);
});

app.get('/', function(req, res){
    res.render('home', {
      teams: ['Congo', 'Côte d\'Ivoire', 'Rojava', 'Sénégal', 'Togo'],
    });
});

// initialize
clear();
console.log('Buzzer lockout ACAFUL version', version);

app.listen(1337, function () {
  console.log('Listening on 1337');
});
