ember-midi-player
=================
###Aplicación Ember.js:

* Todos los componentes de ember.js están en el fichero:	**app.js**
* Todas las vistas handlebars están en el fichero:		**index.html**
* Se utiliza el siguiente css:
  * el CDN de bootstrap:  **"//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css"**
  * el css propio: **"mystyle.css"**

Se instancia al inicio de app.js

     App = Ember.Application.create();

- - -
####App.InputFile

   Se carga un archivo desde un _input type="file" html_, se lee con `var reader = new FileReader()` y se envía el resultado en el _evento load_ si el mime del archivo corresponde al _typeCheck_.

    {{ input-file typeCheck='audio/mid' format='DataURL' load="onLoadFile" }}

   Se ha de definir el siguiente helper

    Ember.Handlebars.helper('input-file', App.InputFile)

**Atributos**

* _typeCheck_: ( String ) Indica el mime del archivo aceptable para cargar

  * si se omite el valor es '*'
  * '*' cualquier tipo de archivo

* _format_: ( String ) Indica el tipo de lectura sobre el archivo cargado.

  * 'ArrayBuffer'  `reader.readAsArrayBuffer( archivo )`
  * 'BinaryString'  `reader.readAsBinaryString( archivo )`
  * 'DataURL'  `reader.readAsDataURL( archivo )`
  * 'Text' `reader.readAsText( archivo )`
  * si se omite el valor es 'Text'
  * si el valor es erróneo se asume el valor 'Text'

**Eventos**

* load: Se dispara cuando el archivo está cargado `reader.onload` con la siguiente información:

  * event.name - nombre del archivo
  * event.mime - tipo mime del archivo
  * event.result - Contenido del archivo `reader.result`

En nuestro caso este evento lo escucha el controlador principal _App.PlayerController_ con el action _onLoadFile_.

- - -
####App.PlayerController

Controlador principal.

**Atributos**

* _nombre_: nombre del archivo cargado. Se inicializa en la action _onLoadFile_
* _mime_: tipo mime del archivo cargado. Se inicializa en la action _onLoadFile_
* _contenido_: contenido del archivo cargado o null si no se ha cargado ninguno. Se inicializa en la action _onLoadFile_
* _songTime_: tiempo en segundos de reproducción de la canción. Se inicializa en la action _updateProgress_
* _songDuration_: duración en segundos de la canción. Se inicializa en la action _updateSongInfo_


- - -
####App.PlayerControlsComponent

El componente se encarga de mostrar unos botones de _stop_, _play_,  _pause_ y lanzar los respectivos eventos.

    {{ player-controls clickPlay='play' clickStop='stop' clickPause='pause' clickVolumeDown='downVolume' clickVolumeUp='upVolume' nowPlaying=nombreCancion showVolumeControl=showVolume volume=midiVolume}}

**Atributos**

* _nowPlaying_ Pensado para recibir el nombre de la canción, se muestra en la vista
* _isPlaying_ ( bool ) Indica si al componente ha enviado la orden de reproducción.
* _isPaused_ ( bool ) Indica si el componente ha enviado la orden de pausa en la reproducción.
* _volume_ ( int ) Recibe el volumen de _App.MidiPlayerComponent_.
* _showVolumeControl_ ( bool ) Indica si se han de mostrar los botones de volumen y el volumen. En nuestro caso recibe el valor de _App.MidiPlayerComponent_.

**Eventos**

* clickPlay: Se lanza cuando se pulsa el botón play y _isPlaying_ es false.
* clickStop: Se lanza cuando se pulsa el botón stop y _isPlaying_ es true o _isPause_ es true.
* clickPause: Se lanza cuando se pulsa el botón pause y _isPlaying_ es true.
* clickVolumeDown: Se lanza cuando se pulsa el botón bajar volumen.
* clickVolumeUp: Se lanza cuando se pulsa el botón subir volumen.


En nuestro caso escuchan estos eventos los **actions** _play_, _stop_, _pause_, _downVolume_ y _upVolume_ respectivamente de _App.MidiPlayerComponent_.

- - -
####App.MidiPlayerComponent

El componente se encarga de gestionar la carga y reproducción de un archivo midi mediante MIDI.js, que se puede encontrar en [GitHub](http://github.com/mudcube/MIDI.js).

La carga del archivo `MIDI.Player.loadFile(url);` es automática cuando cambian los valores de _url_ o _checkType_ en el constructor.


   {{ midi-player checkType=mime url=contenido tick="updateProgress" load="updateSongInfo" nombreCancion=nombre stepVolume=10 }}


Muestra los botones para mostrar/ocultar las vistas de los canales midi de reproducción y las notas, _App.midiPlayChannelsComponent_ y _App.midiPlayNotesComponent_ respectivamente.

**Atributos**

* _checkType_ ( string ) Le asignamos el atributo _mime_ del controlador principal para determinar si es tiene el formato 'audio/mid'.
* _url_ ( string ) Le asignamos el atributo _contenido_ del controlador principal que es el archivo cargado
* _loaded_ ( bool ) True cuando se ha cargado algún archivo.
* _nombreCancion_ ( string ) Le asignamos el atributo _nombre_ del controlador principal para pasarlo al componente PlayerControls.
* _showChannels_ ( bool ) True/False Enseñar los canales midi.
* _showNotes_ ( bool ) True/False Enseñar las notas.
* _showVolume_ ( bool ) True/False Enseñar los controles de volumen. 
* _midiVolume_ ( int ) Volumen
* _stepVolume_ ( int ) Paso para subir/bajar volumen. El valor por defecto es 10.
* _currentTime_ ( int ) Tiempo actual de reproducción. Se obtiene de _MIDI.Player.setAnimation(this.animateCallback)_.
* _dataListenerChannel_ ( int ) Canal actual en reproducción. Se obtiene de _MIDI.Player.addListener(this.listenerCallback)_.
* _dataListenerNote_ ( int ) Nota actual en reproducción. Se obtiene de _MIDI.Player.addListener(this.listenerCallback)_.
* _dataListenerMessage_ ( int ) Devuelve 144 si empieza la nota o 128 si acaba la nota. Se obtiene de _MIDI.Player.addListener(this.listenerCallback)_.

**Eventos**

* _tick_ Se lanza cada vez que cambia el tiempo de reproducción recogido de _MIDI.Player.setAnimation(this.animateCallback)_ enviando el tiempo actual de reproducción.

En nuestro caso lo escucha el **action** _updateProgress_ de  _App.PlayerController_ para enviar el tiempo transcurrido a App.ProgressBarComponent


####ACLARACION SOBRE EL VOLUMEN EN MIDI.js

MIDI.js autodetecta la mejor api del navegador para reproducir archivos midi y cada una de ellas gestiona el control de volumen de forma diferente. Se puede saber que api se utiliza con la propiedad _MIDI.api_. 

**MIDI.setVolume(canal,volumen)**

* En el api _flash_  no tiene ningún efecto. 
* En el api _webaudio_ y _audiotag_ tiene efecto sobre el volumen general, pero no sobre el volumen de los canales. 
* En el api _webmidi_ se cambia el volumen de un canal en concreto. 

MIDI.js da valores al volumen de 0 a 127. 
En este componente no implementamos la posibilidad de cambiar el volumen de un canal individual y se cambiaría el de todos los canales en el caso de que la api fuese _webmidi_ .


- - -
####App.PlayMidiChannelsComponent

Muestra las notas que se están reproduciendo y en que canal con efectos CSS determinados por el valor del atributo _isPlaying_ y _state_ de cada canal.

    {{ play-midi-channels dLChannel=dataListenerChannel dLNote=dataListenerNote dLMessage=dataListenerMessage }}

**Atributos**

* _dLChannel_ ( int ) Número de canal en reproducción actual
* _dLNote_ ( int ) Número de nota en reproducción actual
* _dLMessage_ ( int ) 144 noteOn 128 NoteOff
* _midiChannels_ ( Ember.ArrayController ) Array de canales midi del 0 al 15
  * _idChannel_ ( int ) número de canal.
  * _state_ ( string ) 'mute' o 'active'. Indica si el canal está silenciado o no.
  * _note_ ( int ) número de nota. 
  * _isPlaying ( string ) 'noteOn' si empiza la reproducción de la nota, 'noteOff' si acaba


El array de canales se crea con **Ember.ArrayController** ya que añade la propiedad _content_ al array que luego puede ser manejada con Ember.set para que los cambios en los elementos del array sean visibles a la vista.

La vista de canales se crea recorriendo _midiChannels_

    {{#each midiChannels }}

    ...

    {{/each}}

En cada canal se crean atributos para los efectos CSS

    <div class="col-md-12 channel" {{ bind-attr data-channelState=state }} 
		{{ bind-attr data-channelPlaying=isPlaying }}>


En cada canal se muestran dos botones para activar o silenciar el canal respectivamente.

    <button class="btn btn btn-danger btnMuteChannel" {{ bind-attr data-channel=idChannel }} {{ action 'channelOff' idChannel }} >
		<span class="glyphicon glyphicon-volume-off">
	</button> 
	<button class="btn btn btn-primary btnMuteChannel" {{ bind-attr data-channel=idChannel }} {{ action 'channelOn' idChannel }} >
		<span class="glyphicon glyphicon-volume-up"> 
	</button>


La actualización automática de la vista la hacemos desde 

    writeChannelNote: function () {
	   ...
		
    }.observes('dLChannel','dLNote','dLMessage')

- - -
####App.PlayMidiNotesComponent

Muestra las notas que se están reproduciendo con efectos CSS determinados por el valor del atributo _state_ de cada nota.

    {{ play-midi-notes dLNote2=dataListenerNote dLMessage2=dataListenerMessage }}

**Atributos**

* _dLNote2_ ( int ) Número de nota en reproducción actual
* _dLMessage2_ ( int ) 144 noteOn 128 NoteOff
* _midiNotes_ ( Ember.ArrayController ) Array de notas. Se crea desde el array _MIDI.noteToKey_
  * _note_ ( int ) número de nota. 
  * _state_ ( string ) 'inactive' o 'active'. Indica si la nota suena o no.

El array de notas se crea con **Ember.ArrayController** ya que añade la propiedad _content_ al array que luego puede ser manejada con Ember.set para que los cambios en los elementos del array sean visibles a la vista.

La vista de notas se crea recorriendo _midiNotes_

    {{#each midiNotes }}

    ...

    {{/each}}

En cada canal se crean atributos para los efectos CSS

    <div class="Nota col-md-1" {{ bind-attr data-noteState=state }}>


La actualización automática de la vista la hacemos desde 

    writeChannelNote: function () {
	   ...
		
    }.observes('dLNote2','dLMessage2')


