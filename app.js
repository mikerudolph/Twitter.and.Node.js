/* App.js setup for running twitter oauth with node.js
and express. */

// vars setup
var app_root                = __dirname,
    express                 = require('express'),
    path                    = require('path'),
    sys                     = require('util'),
    oauth                   = require('oauth'),
    twit                    = require('twit'),
    _twitterConsumerKey     = 'YOUR_CONSUMER_KEY',
    _twitterConsumerSecret  = 'YOUR_CONSUMER_SECRET';

var app = express();

function consumer(){
    return new oauth.OAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        _twitterConsumerKey,
        _twitterConsumerSecret,
        '1.0A',
        'http://localhost/app/callback',
        'HMAC-SHA1'
    );
}

function verifyAuth(req, res, next) {
    if ( req.session.oauthAccessToken ) {
        next();
    } else {
        res.redirect('/app/auth');
    }
}

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(path.join(app_root, 'public')));
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack:      true
    }));
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'Gangam Style'}));
    app.use(app.router);
});

app.locals({
    session: function(req, res) {
        return req.session;
    }
});

app.get('/', function(req, res){
    //do something interesting here with your index
});

app.get('/app/auth', function(req, res){
    consumer().getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
        if ( error ) {
            res.send('Error Authenticating');
        } else {
            req.session.oauthRequestToken       = oauthToken;
            req.session.oauthRequestTokenSecret = oauthTokenSecret;
            res.redirect('https://api.twitter.com/oauth/authorize?oauth_token=' + req.session.oauthRequestToken);
        }
    });
});

app.get('/app/callback', function(req, res) {
    sys.puts(">>"+req.session.oauthRequestToken);
    sys.puts(">>"+req.session.oauthRequestTokenSecret);
    sys.puts(">>"+req.query.oauth_verifier);

    consumer().getOAuthAccessToken(req.session.oauthRequestToken,
                                   req.session.oauthRequestTokenSecret,
                                   req.query.oauth_verifier,
                                    function(error, oauthAccessToken, oauthAccessTokenSecret, results){
                                        if ( error ) {
                                            res.send('Error getting access token');
                                        } else {
                                            req.session.oauthAccessToken        = oauthAccessToken;
                                            req.session.oauthAccessTokenSecret  = oauthAccessTokenSecret;

                                            res.redirect('/app/main');
                                        }
                                    });
});

app.get('/app/main', verifyAuth, function(req, res){
    var T = new twit({
        consumer_key:        _twitterConsumerKey,
        consumer_secret:     _twitterConsumerSecret,
        access_token:        req.session.oauthAccessToken,
        access_token_secret: req.session.oauthAccessTokenSecret
    });

    T.get('account/verify_credentials', function(err, reply){
        res.send('Hello there, ' + reply['name']);
    });
});

app.listen(80);