# CLIP Installation and Usage Notes

## Installation

CLIP has been installed successfully in your Python environment using:
```bash
pip install git+https://github.com/openai/CLIP.git
```

## Important: Restart Kernel After Installation

**After installing CLIP, you MUST restart your Jupyter notebook kernel** for the changes to take effect.

### Steps to Fix CLIP Loading Error:

1. **Restart the Kernel:**
   - In Jupyter Notebook: Go to `Kernel` → `Restart Kernel`
   - In VS Code: Click the restart button in the notebook toolbar
   - In JupyterLab: Go to `Kernel` → `Restart Kernel`

2. **Re-run all cells from the beginning:**
   - Start from Cell 0 (installation cell)
   - Run all cells in order

3. **Verify CLIP is loaded:**
   - The CLIP loading cell should now show: `✓ CLIP model loaded successfully!`
   - If you still see errors, check the error message for specific issues

## Testing CLIP Installation

You can test if CLIP is working by running this in a Python cell:

```python
import clip
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load CLIP model (will download on first run)
model, preprocess = clip.load("ViT-B/32", device=device)
print("✓ CLIP model loaded successfully!")
```

## Troubleshooting

### Error: "No module named 'clip'"
- **Solution:** Restart the kernel after installing CLIP
- If the error persists, install CLIP in a terminal:
  ```bash
  pip install git+https://github.com/openai/CLIP.git
  ```

### Error: "Failed to download model"
- **Solution:** Check your internet connection
- CLIP models are downloaded from HuggingFace on first use
- Models are cached in `~/.cache/clip/` for future use

### Error: "CUDA out of memory"
- **Solution:** Use CPU mode by setting `device = "cpu"`
- Or reduce batch size if processing multiple images

### Slow loading on first run
- **Normal:** CLIP model (~330MB) is downloaded on first use
- Subsequent runs will be faster as the model is cached

## Requirements

- Python 3.7+
- PyTorch 1.7.1+
- torchvision
- ftfy
- regex
- tqdm

All these should be installed automatically when installing CLIP.

## Model Information

- **Model:** ViT-B/32 (Vision Transformer Base)
- **Size:** ~330MB
- **Device:** CPU or CUDA (GPU)
- **Download:** Automatic on first use
- **Cache:** `~/.cache/clip/`

## Usage in Notebook

Once CLIP is loaded, you can use it to calculate image-text similarity:

```python
# Calculate similarity between image and text
similarity = calculate_clip_similarity(image_path, text)
print(f"Similarity: {similarity:.4f}")
```

The similarity score ranges from -1 to 1, where:
- **1.0** = Perfect match (image and text are highly related)
- **0.0** = No relationship
- **-1.0** = Opposite relationship (rare)

For report evaluation, similarities typically range from 0.1 to 0.3 for related content.

