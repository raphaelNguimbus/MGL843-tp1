"============================================================"
"Script Pharo - Export des métriques"
"  il vaut mieux tester ce script dans un Playground si vous le modifiez"
"============================================================"
| modelFile model classes stream writer srcDir |

"--- 1. Localiser le fichier model.json ---"
"On cherche d'abord dans le répertoire courant,"
"puis dans le workspace GitHub Actions si non trouvé."
"Le modèle doit être au même endroit où il a été généré par ts2famix."
"Sinon, les SourceAnchors ne seront pas corrects et les métriques"
" concernant le code source, ex. numberOfLinesOfCode"
" ne seront pas correctes."
modelFile := './model.json' asFileReference.

modelFile exists ifFalse: [
    modelFile := (Smalltalk os environment at: 'GITHUB_WORKSPACE' ifAbsent: [ '.' ]), '/model.json'.
    modelFile := modelFile asFileReference.
].

Transcript show: 'CI Export Script - Start'; cr.
Transcript show: 'Model file path: ', modelFile fullName; cr.
Transcript show: 'File exists: ', modelFile exists printString; cr.

modelFile exists ifFalse: [
    Transcript show: 'model.json not found'; cr.
    self error: 'model.json not found'.
].

"--- 2. Charger le modèle JSON dans Moose ---"
"FamixTypeScriptModel est la classe du métamodèle chargée à l'étape"
"précédente par Metacello (via .ston)."
"importFromJSONStream: lit le JSON et crée les entités Famix en mémoire."
Transcript show: 'Loading model into Moose...'; cr.
modelFile readStreamDo: [ :readStream |
    model := FamixTypeScriptModel new importFromJSONStream: readStream.
    "To find the source code of the model"
    model rootFolder: './'.
].
Transcript show: 'Model loaded.'; cr.

"--- 3. Extraire les métriques ---"
"allModelClasses retourne toutes les entités de type FamixTypeScriptClass."
classes := model allModelClasses.
Transcript show: 'Classes found: ', classes size printString; cr.

"Ouverture du fichier .md en écriture."
stream := './export_metrics.md' asFileReference writeStream.

stream nextPutAll: 'Current working directory: '; nextPutAll: FileSystem workingDirectory pathString; cr; cr.

srcDir := './src' asFileReference.

srcDir exists ifTrue: [
    stream nextPutAll: 'Files in src/ directory:'; cr.
    srcDir entries do: [ :entry |
        entry isFile ifTrue: [
            stream nextPutAll: '- '; nextPutAll: entry name; cr.
        ].
    ].
    stream cr.
] ifFalse: [
    stream nextPutAll: 'src/ directory not found'; cr; cr.
].

stream nextPutAll: 'There are '; nextPutAll: classes size asString; nextPutAll: ' classes  '; cr; cr.

"Produce a markdown table."
stream nextPutAll: '| Class | Methods | Attributes | Lines of Code |'; cr.
stream nextPutAll: '|-------|---------|------------|---------------|'; cr.
classes do: [ :each |
    stream nextPutAll: '| '; nextPutAll: each name; nextPutAll: ' | ';
        nextPutAll: each numberOfMethods asString; nextPutAll: ' | ';
        nextPutAll: each numberOfAttributes asString; nextPutAll: ' | ';
        nextPutAll: each numberOfLinesOfCode asString; nextPutAll: ' |';
        cr.
].

stream close.

Transcript show: 'Export complete - export_metrics.md'; cr.