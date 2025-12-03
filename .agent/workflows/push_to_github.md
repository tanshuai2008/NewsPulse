---
description: How to push code to GitHub
---

1.  **Create a Repository on GitHub**:
    -   Go to [github.com/new](https://github.com/new).
    -   Name it `news-pulse` (or whatever you prefer).
    -   Do **not** initialize with README, .gitignore, or License (we already have them).
    -   Click **Create repository**.

2.  **Link your local repository**:
    -   Copy the URL of your new repository (e.g., `https://github.com/username/news-pulse.git`).
    -   Run the following command in your terminal (replace the URL):
    ```powershell
    git remote add origin https://github.com/YOUR_USERNAME/news-pulse.git
    git branch -M main
    git push -u origin main
    ```

3.  **Verify**:
    -   Refresh your GitHub repository page to see your code.
