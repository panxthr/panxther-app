import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Image,
  Video,
  Link,
  Type,
  FileText
} from 'lucide-react';

const RichTextEditor = ({ initialContent = '', onChange = () => {}, placeholder = 'Start writing...' }) => {
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      if (initialContent) {
        editorRef.current.innerHTML = initialContent;
      }
      setIsInitialized(true);
    }
  }, [initialContent, isInitialized]);

  const handleCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Create a temporary image to check dimensions
        const tempImg = document.createElement('img');
        tempImg.onload = () => {
          // Create canvas for resizing if needed
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set maximum dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          
          let { width, height } = tempImg;
          
          // Calculate new dimensions if image is too large
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          // Set canvas dimensions and draw resized image
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(tempImg, 0, 0, width, height);
          
          // Create final image element
          const img = document.createElement('img');
          img.src = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.margin = '10px auto';
          img.style.display = 'block';
          img.style.borderRadius = '4px';
          img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          
          // Insert the image at cursor position
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            editorRef.current.appendChild(img);
          }
          
          handleContentChange();
          editorRef.current.focus();
        };
        tempImg.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow same file to be selected again
    event.target.value = '';
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const video = document.createElement('video');
        video.src = e.target.result;
        video.controls = true;
        video.style.maxWidth = '100%';
        video.style.height = 'auto';
        video.style.margin = '10px 0';
        
        // Insert the video at cursor position
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(video);
          range.setStartAfter(video);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          editorRef.current.appendChild(video);
        }
        
        handleContentChange();
        editorRef.current.focus();
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow same file to be selected again
    event.target.value = '';
  };

  const insertImage = () => {
    imageInputRef.current?.click();
  };

  const insertVideo = () => {
    videoInputRef.current?.click();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const text = window.getSelection().toString() || prompt('Enter link text:') || url;
      handleCommand('insertHTML', `<a href="${url}" target="_blank">${text}</a>`);
    }
  };

  const setHeading = (level) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
      
      if (selectedText) {
        const headingElement = document.createElement(`h${level}`);
        headingElement.textContent = selectedText;
        
        try {
          range.deleteContents();
          range.insertNode(headingElement);
          selection.removeAllRanges();
          
          // Place cursor after the heading
          const newRange = document.createRange();
          newRange.setStartAfter(headingElement);
          newRange.collapse(true);
          selection.addRange(newRange);
        } catch (e) {
          // Fallback method
          handleCommand('formatBlock', `<h${level}>`);
        }
      } else {
        handleCommand('formatBlock', `<h${level}>`);
      }
    }
    handleContentChange();
  };

  const ToolbarButton = ({ onClick, children, title }) => (
    <button
      onClick={onClick}
      className="p-2 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
      title={title}
      type="button"
    >
      {children}
    </button>
  );

  const HeadingDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center gap-1"
          title="Headings"
          type="button"
        >
          <Type size={18} />
          <span className="text-xs">▼</span>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-32">
            <button
              onClick={() => {
                handleCommand('formatBlock', 'p');
                setIsOpen(false);
                handleContentChange();
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
            >
              Normal
            </button>
            {[1, 2, 3, 4, 5, 6].map(level => (
              <button
                key={level}
                onClick={() => {
                  setHeading(level);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 hover:bg-gray-100 font-bold`}
                style={{ fontSize: `${1.5 - (level - 1) * 0.1}rem` }}
              >
                Heading {level}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full mx-auto mb-20 bg-white border border-gray-300 rounded-lg shadow-sm">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        style={{ display: 'none' }}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-200 bg-gray-50">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <ToolbarButton onClick={() => handleCommand('bold')} title="Bold (Ctrl+B)">
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('italic')} title="Italic (Ctrl+I)">
            <Italic size={18} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('underline')} title="Underline (Ctrl+U)">
            <Underline size={18} />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <HeadingDropdown />
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <ToolbarButton onClick={() => handleCommand('justifyLeft')} title="Align Left">
            <AlignLeft size={18} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('justifyCenter')} title="Align Center">
            <AlignCenter size={18} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('justifyRight')} title="Align Right">
            <AlignRight size={18} />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <ToolbarButton onClick={() => handleCommand('insertUnorderedList')} title="Bullet List">
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('insertOrderedList')} title="Numbered List">
            <ListOrdered size={18} />
          </ToolbarButton>
        </div>

        {/* Media & Links */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={insertImage} title="Upload Image">
            <Image size={18} />
          </ToolbarButton>
          <ToolbarButton onClick={insertVideo} title="Upload Video">
            <Video size={18} />
          </ToolbarButton>
          <ToolbarButton onClick={insertLink} title="Insert Link">
            <Link size={18} />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="h-[920px] p-4 outline-none overflow-y-auto"
        style={{ 
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        onInput={handleContentChange}
        onPaste={(e) => {
          // Allow pasting but clean up afterward
          setTimeout(handleContentChange, 0);
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
        }
        
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.83em 0;
        }
        
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 1em 0;
        }
        
        [contenteditable] h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 1.33em 0;
        }
        
        [contenteditable] h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 1.67em 0;
        }
        
        [contenteditable] h6 {
          font-size: 0.67em;
          font-weight: bold;
          margin: 2.33em 0;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 10px auto;
          display: block;
        }
        
        [contenteditable] iframe {
          max-width: 100%;
          margin: 10px 0;
        }
        
        [contenteditable] video {
          max-width: 100%;
          height: auto;
          margin: 10px 0;
        }
        
        [contenteditable] a {
          color: #3B82F6;
          text-decoration: underline;
        }
        
        [contenteditable] a:hover {
          color: #1D4ED8;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        
        [contenteditable] li {
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;