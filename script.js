'use-strict'

window.videojs = {
	init: function (options) {
		const head = document.querySelector('HEAD');
		head.append(createElementFromHTML('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />'));

		const defaultOptions = {
			container: '',
			video: {
				poster: null,
				sources: null,
				controlbar: {
					comments: false
				}
			}
		};

		let opt = extend(true, defaultOptions, options);

		let html = '<div class="video-player"><div class="video-wrapper">'
			+ '<video class="video-element" preload="metadata"';

		if (opt.video.poster) {
			html += 'poster="' + opt.video.poster + '"';
		}
		else {
			html += '>';
		}

		if (opt.video.sources) {
			opt.video.sources.forEach((val, ind) => {
				let type = 'video/';
				if (val.indexOf('.mp4') > -1) {
					type += 'mp4';
				}
				else if (val.indexOf('.webm') > -1) {
					type += 'webm';
				}
				else {
					type += 'ogg';
				}
				html += '<source src="' + val + '" type="' + type + '">';
			});
		}

		html += 'Your browser doesn\'t support the video tag.</video>'
			+ '<div class="video-controls">'
			+ '<div class="progress-bar-fill" style="width:0;"></div>'
			+ '<button class="btn btn-backward"><span class="fa fa-backward"></span></button>'
			+ '<button class="btn btn-play"><span class="fa fa-play"></span></button>'
			+ '<button class="btn btn-forward"><span class="fa fa-forward"></span></button>'
			+ '<button class="btn btn-stop"><span class="fa fa-stop"></span></button>'
			+ '<span id="curtimetext">00:00</span> / <span id="durtimetext">00:00</span>'
			+ '<button class="btn btn-mute"><span class="fa fa-volume-up"></span></button>'
			+ '<input type="range" class="slider-volume" min="0" max="100" value="100" />';

		if (opt.video.controlbar.comments) {
			html += '<button class="btn btn-comments"><span class="fa fa-comments"></span></button>'
		}

		html += '<button class="btn btn-expand"><span class="fa fa-expand"></span></button></div></div>'
			+ '<div class="comments-box" style="display:none;height:auto;">'
			+ '<div class="comments-wrapper">'
			+ '<iframe width="100%" height="100%" src="https://www.youtube.com/live_chat?v=' + opt.video.id + '&embed_domain=' + window.location.hostname + '"'
			+ 'frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
			+ '</div></div ></div>';

		const parentEl = document.querySelector(opt.container);
		parentEl.append(createElementFromHTML(html));

		setup(opt);
	}
}

function setup(options) {
	const videoControlElement = document.querySelector('.video-controls');
	const videoContainerElement = document.querySelector('.video-wrapper');
	const videoPlayerElement = document.querySelector('.video-player');
	const curtimeElement = document.getElementById("curtimetext");
	const durtimeElement = document.getElementById("durtimetext");
	const progressBarFill = document.querySelector('.progress-bar-fill');
	const btnExpandIcon = document.querySelector('.btn-expand>.fa');
	const btnMuteIcon = document.querySelector('.btn-mute>.fa');
	const btnPlayIcon = document.querySelector('.btn-play>.fa');
	const btnBackward = document.querySelector('.btn-backward');
	const btnExpand = document.querySelector('.btn-expand');
	const btnMute = document.querySelector('.btn-mute');
	const btnPlay = document.querySelector('.btn-play');
	const btnForward = document.querySelector('.btn-forward');
	const btnStop = document.querySelector('.btn-stop');
	const videoElement = document.querySelector('.video-element');
	const sliderVolumeElement = document.querySelector('.slider-volume');
	const btnComments = document.querySelector('.btn-comments');
	const commentsElement = document.querySelector('.comments-box');

	let currentVolumeVal = 100;
	let timeoutInMiliseconds = 3000;
	let timeoutId;
	let commentsRendered = false;

	expandVideo = () => {
		if (
			document.fullscreenElement ||
			document.webkitFullscreenElement ||
			document.mozFullScreenElement ||
			document.msFullscreenElement
		) {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) {
				document.msExitFullscreen();
			}
			btnExpandIcon.classList.add('fa-expand');
			btnExpandIcon.classList.remove('fa-compress');
		}
		else {
			if (videoPlayerElement.requestFullscreen) {
				videoPlayerElement.requestFullscreen();
			} else if (videoPlayerElement.mozRequestFullScreen) {
				videoPlayerElement.mozRequestFullScreen();
			} else if (videoPlayerElement.webkitRequestFullscreen) {
				videoPlayerElement.webkitRequestFullscreen();
			}
			btnExpandIcon.classList.remove('fa-expand');
			btnExpandIcon.classList.add('fa-compress');
		}
	}

	moveBackward = () => {
		videoElement.currentTime -= 5;
	}

	moveForward = () => {
		videoElement.currentTime += 5;
	}

	muteVideo = () => {
		if (videoElement.muted) {
			videoElement.muted = false;
			sliderVolumeElement.value = currentVolumeVal;
			btnMuteIcon.classList.add('fa-volume-up');
			btnMuteIcon.classList.remove('fa-volume-off');
		} else {
			videoElement.muted = true;
			sliderVolumeElement.value = 0;
			btnMuteIcon.classList.add('fa-volume-off');
			btnMuteIcon.classList.remove('fa-volume-up');
		}
	}

	playPauseVideo = () => {
		if (videoElement.paused) {
			videoElement.play();

			btnPlayIcon.classList.remove('fa-play');
			btnPlayIcon.classList.add('fa-pause');
		} else {
			videoElement.pause();

			btnPlayIcon.classList.remove('fa-pause');
			btnPlayIcon.classList.add('fa-play');
		}
	}

	stopVideo = () => {
		videoElement.pause();
		videoElement.currentTime = 0;
		btnPlayIcon.classList.remove('fa-pause');
		btnPlayIcon.classList.add('fa-play');
	}

	updateProgress = () => {
		let value = (100 / videoElement.duration) * videoElement.currentTime;

		let curmins = Math.floor(videoElement.currentTime / 60);
		let cursecs = Math.floor(videoElement.currentTime - curmins * 60);
		let durmins = Math.floor(videoElement.duration / 60);
		let dursecs = Math.floor(videoElement.duration - durmins * 60);
		if (cursecs < 10) { cursecs = "0" + cursecs; }
		if (dursecs < 10) { dursecs = "0" + dursecs; }
		if (curmins < 10) { curmins = "0" + curmins; }
		if (durmins < 10) { durmins = "0" + durmins; }
		curtimeElement.innerHTML = curmins + ":" + cursecs;
		durtimeElement.innerHTML = durmins + ":" + dursecs;

		progressBarFill.style.width = value + '%';
	}

	updateVideoVolume = () => {
		let volumeVal = sliderVolumeElement.value;
		videoElement.volume = volumeVal / 100;
		currentVolumeVal = volumeVal;
		if (volumeVal === '0') {
			btnMuteIcon.classList.add('fa-volume-off');
			btnMuteIcon.classList.remove('fa-volume-up');
			btnMuteIcon.classList.remove('fa-volume-down');
		}
		else if (volumeVal == '100') {
			btnMuteIcon.classList.add('fa-volume-up');
			btnMuteIcon.classList.remove('fa-volume-off');
			btnMuteIcon.classList.remove('fa-volume-down');
		}
		else {
			btnMuteIcon.classList.add('fa-volume-down');
			btnMuteIcon.classList.remove('fa-volume-up');
			btnMuteIcon.classList.remove('fa-volume-off');
		}
	}

	resetTimer = () => {
		window.clearTimeout(timeoutId);
		videoControlElement.style.transform = 'translateY(0%)';
		videoContainerElement.style.cursor = 'inherit';
		startTimer();
	}

	startTimer = () => {
		timeoutId = window.setTimeout(doInactive, timeoutInMiliseconds)
	}

	doInactive = () => {
		videoControlElement.style.transform = 'translateY(100%)';
		videoContainerElement.style.cursor = 'none';
	}

	setupTimers = () => {
		videoContainerElement.addEventListener("mousemove", resetTimer, false);
		document.addEventListener("mousedown", resetTimer, false);
		document.addEventListener("keypress", resetTimer, false);
		document.addEventListener("touchmove", resetTimer, false);

		startTimer();
	}

	toggleComments = () => {
		if (!commentsRendered) {
			commentsElement.style.display = 'table-cell';
			videoContainerElement.style.verticalAlign = 'middle';
		}
		else {
			commentsElement.style.display = 'none';
			videoContainerElement.style.verticalAlign = 'inherit';
		}
		commentsRendered = !commentsRendered;
	}

	setupTimers();

	/* ======================== REGISTER EVENT ======================== */
	btnBackward.addEventListener('click', moveBackward, false);
	btnExpand.addEventListener('click', expandVideo, false);
	btnMute.addEventListener('click', muteVideo, false);
	btnPlay.addEventListener('click', playPauseVideo, false);
	btnForward.addEventListener('click', moveForward, false);
	btnStop.addEventListener('click', stopVideo, false);
	sliderVolumeElement.addEventListener('input', updateVideoVolume, false);
	videoContainerElement.addEventListener("mouseleave", () => {
		videoControlElement.style.transform = 'translateY(100%)';
	}, false);
	videoElement.addEventListener('ended', () => {
		btnPlayIcon.classList.remove('fa-pause');
		btnPlayIcon.classList.add('fa-play');
	}, false);
	videoElement.addEventListener('timeupdate', updateProgress, false);
	videoElement.addEventListener('click', playPauseVideo, false);
	if (options.video.controlbar.comments) {
		btnComments.addEventListener('click', toggleComments, false);
	}
}

/* ======================== UTILITIES ======================== */
function createElementFromHTML(htmlString) {
	var div = document.createElement('div');
	div.innerHTML = htmlString.trim();

	return div.firstChild;
}

function extend() {
	let extended = {};
	let deep = false;
	let i = 0;

	if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
		deep = arguments[0];
		i++;
	}

	let merge = function (obj) {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
					extended[prop] = extend(extended[prop], obj[prop]);
				} else {
					extended[prop] = obj[prop];
				}
			}
		}
	};

	for (; i < arguments.length; i++) {
		merge(arguments[i]);
	}

	return extended;
};