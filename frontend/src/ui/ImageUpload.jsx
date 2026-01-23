import React, { useRef, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export function ImageUpload({ onSearchComplete }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload and search
    handleImageSearch(file);
  };

  const handleImageSearch = async (file) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      console.log("📸 Uploading image for visual search...");

      const response = await fetch(`${BACKEND_URL}/image-search`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Image search failed');
      }

      const data = await response.json();
      console.log("✅ Image search results:", data);

      if (onSearchComplete) {
        onSearchComplete(data.items || []);
      }

      // Show success message
      if (data.items && data.items.length > 0) {
        alert(`Found ${data.items.length} similar products!`);
      } else {
        alert('No similar products found. Try a different image.');
      }

    } catch (error) {
      console.error("❌ Image search error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <button
        onClick={handleClick}
        disabled={isUploading}
        style={{
          ...styles.button,
          opacity: isUploading ? 0.6 : 1,
          cursor: isUploading ? 'wait' : 'pointer'
        }}
      >
        {isUploading ? (
          <>
            <span style={styles.spinner}>⏳</span> Analyzing image...
          </>
        ) : (
          <>
            📸 Upload Image to Search
          </>
        )}
      </button>

      {preview && (
        <div style={styles.preview}>
          <img src={preview} alt="Preview" style={styles.previewImage} />
          <div style={styles.previewLabel}>📷 Your image</div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '16px 0'
  },
  button: {
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 600,
    background: 'linear-gradient(135deg, #6b9cff 0%, #4ade80 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(107, 156, 255, 0.4)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  },
  preview: {
    marginTop: 12,
    textAlign: 'center'
  },
  previewImage: {
    maxWidth: 200,
    maxHeight: 200,
    borderRadius: 8,
    border: '2px solid rgba(107, 156, 255, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
  },
  previewLabel: {
    marginTop: 8,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)'
  }
};

// Add spin animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}
