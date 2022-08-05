git add -A .
git commit -m "before reset"

git checkout main && git fetch upstream main && git reset --hard upstream/main
git checkout workbench


rm -rf ./workbench/_instance/extensions/**/* && rm -rf app && rm -rf api && rm -rf packages

git checkout main -- api && git rm -r --cached --ignore-unmatch api
git checkout main -- app && git rm -r --cached --ignore-unmatch app
git checkout main -- packages && git rm -r --cached --ignore-unmatch packages
