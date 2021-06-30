import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  CameraVideoTrackInitConfig,
  MicrophoneAudioTrackInitConfig
} from "agora-rtc-sdk-ng";


class AgoraRTCClient {
  public _joined: boolean = false
  public _client: IAgoraRTCClient;
  public mode: string = 'rtc';
  public _localAudioTrack: ILocalAudioTrack = null;
  public _localVideoTrack: ILocalVideoTrack = null;
  public _audioPublished: boolean = false
  public _videoPublished: boolean = false

  constructor() {
  	AgoraRTC.setLogLevel(0);
  }

  createClient (mode?: string) {
  	this.mode = mode;
  	return AgoraRTC.createClient({
  		mode: mode ? mode : 'rtc',
  		codec: 'vp8'
  	})
  }

  async joinChannel({
  	appId,
  	channel,
  	token,
  	uid,
  	dual
  } : {
  	appId: string,
  	channel: string,
  	token: string,
  	uid: string,
  	dual: boolean
  }) {
  	return new Promise( async (resolve, reject) => {
  		try {
  			const userId = await this._client.join(appId, channel, token, uid);
  			dual && await this._client.enableDualStream();
  			this._joined = true;
  			resolve(userId);
  		} catch (err) {
  			reject(err);
  		}
  	});
  }

  createLocalAudiotrack(config?: MicrophoneAudioTrackInitConfig) {
  	return new Promise( async(resolve, reject) => {
  		try {
  			this._localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack(config);
  			resolve(true);
  		} catch (err) {
  			reject(err);
  		}
  	})
  }

  createLocalVideotrack(config?: CameraVideoTrackInitConfig) {
  	return new Promise( async(resolve, reject) => {
  		try {
  			this._localVideoTrack = await AgoraRTC.createCameraVideoTrack(config);
  			resolve(true);
  		} catch (err) {
  			reject(err);
  		}
  	});
  }

  createLocalTracks(audioConfig?: MicrophoneAudioTrackInitConfig , videoConfig?:CameraVideoTrackInitConfig) {
  	return new Promise( async(resolve, reject) => {
  		try {
  			[ this._localAudioTrack, this._localVideoTrack ]  = await AgoraRTC.createCameraVideoTrack(audioConfig, videoConfig);
  			resolve(true);
  		} catch (err) {
  			reject(err);
  		}
  	});
  }

  publishAudioTrack() {
  	return new Promise( async(resolve, reject) => {
  		try {
  			if(this._audioPublished) {
  				await this.unpublishAudioTrack()
  			}
  			this.mode && await this._client.setClientRole("host");
  			await this._client.publish(this._localAudioTrack);
  			this._audioPublished = true;
  			resolve(true);
  		} catch (err) {
  			reject(err);
  		}
  	})
  }

  publishVideoTrack() {
  	return new Promise( async(resolve, reject) => {
  		try {
  			if(this._videoPublished) {
  				await this.unpublishVideoTrack()
  			}
  			this.mode && await this._client.setClientRole("host");
  			await this._client.publish(this._localVideoTrack);
  			this._videoPublished = true;
  			resolve(true);
  		} catch (err) {
  			reject(err);
  		}
  	})
  }

  publishLocalTracks() {
  	return new Promise( async(resolve, reject) => {
  		try {
  			if(this._audioPublished && this._videoPublished) {
  				await this.unpublishLocalTrack()
  			}
  			this.mode && await this._client.setClientRole("host");
  			await this._client.publish([this._localAudioTrack, this._localVideoTrack]);
  			this._audioPublished = true;
  			this._videoPublished = true;
  			resolve(true);
  		} catch (err) {
  			reject(err);
  		}
  	})
  }

  unpublishAudioTrack() {
  	return new Promise( async(resolve, reject) => {
  		try {
  			this.mode && await this._client.setClientRole("audience");
  			await this._client.unpublish(this._localAudioTrack);
  			this._audioPublished = false;
  			resolve(true);
  		} catch (err) {
  			reject(err);
  		}
  	})
  }

  unpublishVideoTrack() {
  	return new Promise( async(resolve, reject) => {
  		try {
  			this.mode && await this._client.setClientRole("audience");
  			await this._client.unpublish(this._localVideoTrack);
  			this._videoPublished = false;
  			resolve(true);
  		} catch (err) {
  			reject(err);
  		}
  	})
  }

  unpublishLocalTrack() {
  	return new Promise( async(resolve, reject) => {
  		try {
  			this.mode && await this._client.setClientRole("audience");
  			await this._client.unpublish([this._localAudioTrack, this._localVideoTrack]);
  			this._audioPublished = false;
  			this._videoPublished = false;
  			resolve(true);
  		} catch (err) {
  			reject(err);
  		}
  	})
  }

  destroyLocalTracks() {
  	if(this._localAudioTrack) {
  		if (this._localAudioTrack.isPlaying()) {
        this._localAudioTrack.stop()
      }
      this._localAudioTrack.close();
  	}
  	if(this._localVideoTrack) {
  		if (this._localVideoTrack.isPlaying()) {
        this._localVideoTrack.stop()
      }
      this._localVideoTrack.close();
  	}
  	this._localAudioTrack = null;
  	this._localVideoTrack = null;
  }

  async leaveChannel() {
  	this._client.setClientRole("audience");
  	await this._client.leave();
  	this.destroyLocalTracks();
  	this._joined = false;
  	this._audioPublished = false;
  	this._videoPublished = false;
  }

}
