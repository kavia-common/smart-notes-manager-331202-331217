#!/bin/bash
cd /home/kavia/workspace/code-generation/smart-notes-manager-331202-331217/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

