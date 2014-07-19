App = Ember.Application.create();

App.InputFile = Ember.TextField.extend({
	type: 'file',
	change: function (event) {	
		var input = event.target;
		if ( input.files && input.files[0] ) {
			var archivo=input.files[0];
			if ( !this.typeCheck || this.typeCheck === '*' || archivo.type === this.typeCheck ){
				var reader = new FileReader();
				this.format = this.format || 'Text';
				switch ( this.format ){
					case 'ArrayBuffer':
						reader.readAsArrayBuffer( archivo );
						break;
					case 'BinaryString':
						reader.readAsBinaryString( archivo );
						break;
					case 'DataURL':
						reader.readAsDataURL( archivo );
						break;
					case 'Text':
					default:
						reader.readAsText( archivo );
						//this.format='Text';
						break;
				}

				//eval('reader.readAs'+this.format+'(input.files[0])');
				
				reader.onload = (function (_this) { 
					return function (){
						_this.sendAction("load", {
							'name': input.files[0].name,
							'mime': input.files[0].type,
							'result': reader.result

						});	
					}
				})(this);
			}
		}
	}	
});

Ember.Handlebars.helper('input-file', App.InputFile);

Ember.Handlebars.helper('mmss', function (number) {
	if (!number) return '00:00';
	var time = number << 0;
	secs = time % 60;
	mins = (time - secs) / 60;
	mins=((mins<10)?'0':'')+mins;
	secs=((secs<10)?'0':'')+secs;
	return "" + mins + ':' + secs;
});


App.PlayerController = Ember.Controller.extend({
	nombre: null,
	mime: null,
	contenido: null,
	actions:{
		onLoadFile: function (data){

			this.set('nombre',data.name);
			this.set('mime',data.mime);
			this.set('contenido',data.result);

		},
		updateProgress: function (time) {
			this.set('songTime', time);
		},
		updateSongInfo: function (info) {
			this.set('songDuration', info.duration);
		}
	}
});


App.PlayerControlsComponent = Ember.Component.extend({
	isPlaying: false,
	isPaused: false,
	actions:{
		pressPlay: function (){

			var _isPlaying=this.get('isPlaying'),
				_isPaused=this.get('isPaused');

			if ( !_isPlaying || _isPaused ){

				if ( !_isPlaying ) {

					this.set('isPlaying',true);

				} else {

					this.set('isPaused',false);
				}
				
				this.sendAction('clickPlay');
			}
		},
		pressPause: function (){

			var _isPlaying=this.get('isPlaying'),
				_isPaused=this.get('isPaused');

			if ( _isPlaying && !_isPaused ){

				this.set('isPaused',true);
				this.sendAction('clickPause');

			}
		},
		pressStop: function (){

			var _isPlaying=this.get('isPlaying');

			if ( _isPlaying ){

				this.set('isPlaying',false);
				this.set('isPaused',false);
				this.sendAction('clickStop');
			}
		}
	}
})

//Ember.Handlebars.helper('player-controls', App.PlayerControls);


App.MidiPlayerComponent = Ember.Component.extend({
	url: null,
	checkType: null,
	init: function () {
		this._super();
		this.animateCallback = (function (that) {
			return function (event) {		
				that.set('dataNotes',event.events);
				that.set('currentTime', event.now);
				that.sendAction('tick', event.now);
			}
		})(this);
		this.listenerCallback = (function (that){
			return function (event) {
				that.set('dataChannel',event.channel);
				that.set('dataNote',event.note);
				that.set('listenerNow',event.now);
				that.set('listenerEnd',event.end);		
			}
		})(this);
	},
	loadMidiFile: function () {
		if (this.get('checkType') && this.get('checkType')!== 'audio/mid'){
			alert('ERROR\nEl archivo cargado no tiene el formato midi');
			throw 'Error de formato de archivo midi';
		}

		var url = this.get('url');
		if (url && url.match(/^(data|http(s)?):/)){
			MIDI.Player.loadFile(url);
			this.set('loaded',true);
			this.sendAction('load', { duration: MIDI.Player.endTime / 1000 })
		}
	}.observes('url','checkType').on('init'),
	actions: {
		stop: function () {

			MIDI.Player.stop();
			MIDI.Player.clearAnimation();
			MIDI.Player.removeListener();
		},
		play: function () {

			MIDI.Player.start();
			MIDI.Player.setAnimation(this.animateCallback);
			MIDI.Player.addListener(this.listenerCallback);
		},
		pause: function () {

			MIDI.Player.pause();

		},
		putChannelOn: function (midiChannel) {	
			alert('putChannelOn '+midiChannel);
			MIDI.channels[midiChannel].mute=false;
		},
		putChannelOff: function (midiChannel) {
			alert('putChannelOff '+midiChannel);
			MIDI.channels[midiChannel].mute=true;
		}
	}
});

App.PlayMidiChannelsComponent = Ember.Component.extend({
	midiChannels: [ {id: 0},{id: 1},{id: 2},{id: 3},
				{id: 4},{id: 5},{id: 6},{id: 7},
				{id: 8},{id: 9},{id: 10},{id: 11},
				{id: 12},{id: 13},{id: 14},{id: 15}
			  ],
	actions:{
		channelOn: function (midiChannel) {

			this.sendAction('clickOnChannel',midiChannel);
		},
		channelOff: function (midiChannel) {

			this.sendAction('clickOffChannel',midiChannel);

		}
	}
});

App.ProgressBarComponent = Ember.Component.extend({
	color: '#FF0000',
	nowPct: function () {
		var max = this.get('max'),
		 	now = this.get('now');
		if (!max) return '0%';
		var pct = 100.0 * (now || 0) / max;
		return pct.toFixed(2) + '%';
	}.property('max', 'now'),
	nowPctStyle: function () {
		return "width: " + this.get('nowPct') + "; background-color: "+this.get('color')
	}.property('nowPct','color'),
	actions: {
		cambiaColor: function (event) {
			var newColor="#", 
				valorHexa= ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];			for (var i=0;i<6;i++){
			for (var i=0;i<6;i++){
				newColor+=valorHexa[Math.floor(Math.random() * 16)];
			}
			this.set('color',newColor);
			}
		}
	}
});

App.Router.map(function () {
	this.resource('app', { path: '/' });
});

App.AppRoute = Ember.Route.extend({
	controllerName: 'Player'
});

MIDI.loadPlugin({
	instruments: "acoustic_grand_piano",
	soundfontUrl: "./soundfont/",
	targetFormat: "ogg",
	callback: function () {}
});