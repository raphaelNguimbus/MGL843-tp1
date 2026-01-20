# Notes CLI

A simple CLI for managing notes, built with TypeScript.

## Setup
```bash
npm install
npm run build
```

## Usage

You can run the CLI directly using `npm start` or by executing the built file.

### Commands

#### Create a note
```bash
npm start -- create "My important note" -t tag1 tag2
# OR
node dist/index.js create "My important note" -t tag1 tag2
```

#### List notes
```bash
npm start -- list
```

#### Search notes
```bash
npm start -- search "query"
```

#### Add tags
```bash
npm start -- tag <note-id> newtag
```

#### Export notes
```bash
npm start -- export ./my-notes.json
```

## Running Tests
```bash
npm test
```