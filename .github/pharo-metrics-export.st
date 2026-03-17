"============================================================"
"TypeScriptModelCSVExporter class definition"
"============================================================"
Class {
	#name : #TypeScriptModelCSVExporter,
	#superclass : #Object,
	#instVars : [
		#model,
		#outputPath
	],
	#category : #'MGL843-TP1-Export',
	#package : #'MGL843-TP1-Export'
}

{ #category : #'exporting' }
TypeScriptModelCSVExporter >> exportToCSV [
	| classes writeStream |
	classes := model allModelClasses.
	writeStream := outputPath asFileReference writeStream.
	[ self writeCSVTo: writeStream classes: classes ] ensure: [ writeStream close ].
	^ 'CSV exported to ', outputPath.
]

{ #category : #'private' }
TypeScriptModelCSVExporter >> writeCSVTo: writeStream classes: classes [
	"Write header"
	writeStream nextPutAll: 'ClassName,NumberOfMethods,NumberOfAttributes'; cr.
	"Write data rows (no external CSV lib required)"
	classes do: [ :class |
		writeStream
			nextPutAll: (self escapeCSV: class name); nextPut: $,;
			nextPutAll: (class methods size printString); nextPut: $,;
			nextPutAll: (class attributes size printString); cr.
	].
]

{ #category : #'private' }
TypeScriptModelCSVExporter >> escapeCSV: aString [
	"Escape quotes if present"
	(aString includes: $") ifTrue: [ ^ '\"', (aString copyReplaceAll: '\"' with: '\"\"'), '\"' ].
	^ aString.
]

{ #category : #'initialization' }
TypeScriptModelCSVExporter >> initialize [
	super initialize.
	outputPath := 'model-export.csv'.
]

{ #category : #'accessing' }
TypeScriptModelCSVExporter >> model: aModel [
	model := aModel.
]

{ #category : #'accessing' }
TypeScriptModelCSVExporter >> outputPath: aPath [
	outputPath := aPath.
]

"============================================================"
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

"--- 3. Extraire les métriques et écrire le CSV ---"
"allModelClasses retourne toutes les entités de type FamixTypeScriptClass."
classes := model allModelClasses.
Transcript show: 'Classes found: ', classes size printString; cr.

"Ouverture du fichier CSV en écriture avec NeoCSV (inclus dans Pharo)."
"Séparateur : point-virgule (;) pour compatibilité avec Excel FR."
stream := './export_metrics.csv' asFileReference writeStream.
writer := NeoCSVWriter on: stream.
writer separator: $;.

"En-tête du CSV"
writer nextPut: #( 'Nom_Classe' 'Nb_Methodes' 'Nb_Attributs' 'Lignes_de_Code' ).

"Pour chaque classe, on calcule le nombre de lignes de code (LOC)."
"Stratégie LOC inspirée du script du prof."
classes do: [ :each |
    | loc anchor srcFile content snippet |
    loc := 0.

    "Tentative de calcul via le sourceAnchor (méthode principale)"
    anchor := each sourceAnchor.
    (anchor notNil and: [ anchor isKindOf: FamixTypeScriptIndexedFileAnchor ]) ifTrue: [
        srcFile := anchor fileName asFileReference.
        srcFile exists ifTrue: [
            content := srcFile contents.
            snippet := content copyFrom: anchor startPos to: (anchor endPos min: content size).
            loc := snippet lineCount.
        ].
    ].

    "Fallback : somme des LOC des méthodes"
    loc = 0 ifTrue: [
        loc := each methods inject: 0 into: [ :sum :m | sum + (m numberOfLinesOfCode ifNil: [ 0 ]) ].
    ].

    Transcript show: '  ', each name, ' loc:', loc printString; cr.
    writer nextPut: {
        each name.
        each numberOfMethods.
        each numberOfAttributes.
        loc.
    }.
].

stream close.

Transcript show: 'Export complete - export_metrics.csv'; cr.