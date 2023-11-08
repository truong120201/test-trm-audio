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
      const { name, type } = videoFileValue;
      ffmpeg.FS(
        'writeFile',
        name,
        await window.FFmpeg.fetchFile(videoFileValue),
      );
      const videoFileType = type.split('/')[1];
      console.log("🚀 ~ file: App.js:60 ~ handleTrim ~ videoFileType:", videoFileType)
      let finalType = videoFileType === "mp4" ? "mp4" : "mp3";
      await ffmpeg.run(
        '-i',
        name,
        '-ss',
        `00:00`,
        '-to',
        `00:30`,
        '-acodec',
        'copy',
        '-vcodec',
        'copy',
        `out.${finalType}`,
      );
      const data = ffmpeg.FS('readFile',  `out.${finalType}`);
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: videoFileValue.type }),
      );
      setVideoTrimmedUrl(url);
    }
  };

  const downloadTrimmedVideo = () => {
    if (videoTrimmedUrl) {
      fetch(videoTrimmedUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'trimmed_file';
          a.click();
        });
    }
  };

  return (
    <div className="App">
      <input type="file" onChange={handleFileUpload} />
      <br />
      {videoSrc.length ? (
        <React.Fragment>
          <video controls ref={videoRef}>
            <source src={videoSrc} type={videoFileValue.type} />
          </video>
          <br />
          <button onClick={handleTrim}>Trim</button>
          <br />
          {videoTrimmedUrl && (
            <>
            <video controls>
              <source src={videoTrimmedUrl} type={videoFileValue.type} />
            </video>
            <button onClick={downloadTrimmedVideo}>Download Trimmed Video</button>
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