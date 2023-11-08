import React, { useEffect, useRef, useState } from 'react';

let ffmpeg;
function App() {
  const [videoSrc, setVideoSrc] = useState('');
  const [videoFileValue, setVideoFileValue] = useState('');
  console.log(videoFileValue)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [videoTrimmedUrl, setVideoTrimmedUrl] = useState('');
  const videoRef = useRef();

  const loadScript = (src) => {
    return new Promise((onFulfilled, _) => {
      const script = document.createElement('script');
      let loaded;
      script.async = 'async';
      script.defer = 'defer';
      script.setAttribute('src', src);
      script.onreadystatechange = script.onload = () => {
        if (!loaded) {
          onFulfilled(script);
        }
        loaded = true;
      };
      script.onerror = function () {
        console.log('Script failed to load');
      };
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const blobURL = URL.createObjectURL(file);
    setVideoFileValue(file);
    setVideoSrc(blobURL);
  };

  useEffect(() => {
    loadScript(
      'ffmpeg.min.js',
    ).then(() => {
      if (typeof window !== 'undefined') {
        ffmpeg = window.FFmpeg.createFFmpeg({ log: true });
        ffmpeg.load();
        setIsScriptLoaded(true);
      }
    });
  }, []);

  const handleTrim = async () => {
    if (isScriptLoaded) {
      const { name } = videoFileValue;
      ffmpeg.FS(
        'writeFile',
        name,
        await window.FFmpeg.fetchFile(videoFileValue),
      );
      const nameSplit = name.split('.');
      const nameType = nameSplit[nameSplit.length - 1];
      await ffmpeg.run(
        '-i',
        name,
        '-ss',
        `00:00`,
        '-to',
        `00:20`,
        '-acodec',
        'copy',
        '-vcodec',
        'copy',
        `out.${nameType}`,
      );
      const data = ffmpeg.FS('readFile',  `out.${nameType}`);
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: videoFileValue.type }),
      );
      setVideoTrimmedUrl(url);
    }
  };

  return (
    <div className="App">
      <input type="file" onChange={handleFileUpload} />
      <br />
      {videoSrc.length ? (
        <React.Fragment>
          <video controls ref={videoRef} disablePictureInPicture>
            <source src={videoSrc} />
          </video>
          <br />
          <button onClick={handleTrim}>Trim</button>
          <br />
          {videoTrimmedUrl && (
            <>
            <video controls disablePictureInPicture>
              <source src={videoTrimmedUrl} />
            </video>
            </>
          )}
        </React.Fragment>
      ) : (
        ''
      )}
    </div>
  );
}

export default App;