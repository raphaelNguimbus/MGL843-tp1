"============================================================"
"Script Pharo - Export des métriques de qualité en CSV"
"============================================================"
"Ce script est exécuté dans une image Moose par smalltalkCI."
"Il effectue 3 étapes :"
"  1. Charger le modèle Famix (model.json) généré par ts2famix"
"  2. Extraire les métriques de chaque classe"
"     (NOM, NOA, LOC, WMC, CBO_in, CBO_out, RFC, TCC)"
"  3. Écrire les résultats dans export_metrics.csv"
"============================================================"

| modelFile model classes stream writer |

"--- 1. Localiser le fichier model.json ---"
"On cherche d'abord dans le répertoire courant,"
"puis dans le workspace GitHub Actions si non trouvé."
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
"précédente par Metacello (via moose-config.ston)."
"importFromJSONStream: lit le JSON et crée les entités Famix en mémoire."
Transcript show: 'Loading model into Moose...'; cr.
modelFile readStreamDo: [ :readStream |
    model := FamixTypeScriptModel new importFromJSONStream: readStream.
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
writer separator: $,.

"En-tête du CSV"
writer nextPut: #( 'ClassName' 'SLOC' 'NumberOfMethods' 'NumberOfAttributes' 'WMC' 'CBO_in' 'CBO_out' 'RFC' 'TCC' ).

"Pour chaque classe, on calcule le nombre de lignes de code (LOC)."
"La stratégie de calcul du LOC :"
"  - Priorité : lire le fichier source via le sourceAnchor de la classe"
"    (positions startPos à endPos) et compter les lignes."
"  - Fallback : si le fichier source n'est pas trouvé, sommer les LOC"
"    de toutes les méthodes de la classe."
classes do: [ :each |
    | loc anchor srcFile content snippet distinctCalledMethods rfc |
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

    "Calcul du RFC : nombre de méthodes + nombre de méthodes distinctes appelées"
    distinctCalledMethods := (each outgoingInvocations collect: [ :i | i candidates ]) flatten asSet.
    rfc := each methods size + distinctCalledMethods size.

    Transcript show: '  ', each name, ' loc:', loc printString; cr.
    writer nextPut: {
        each name.
        each numberOfMethods.
        each numberOfAttributes.
        loc.
        each weightedMethodCount.
        each allClients size.
        each allProviders size.
        rfc.
        each tightClassCohesion.
    }.
].

stream close.

Transcript show: 'Export complete - export_metrics.csv'; cr.
