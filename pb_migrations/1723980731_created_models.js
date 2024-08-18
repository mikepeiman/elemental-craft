/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "mrxkweem2ybaleb",
    "created": "2024-08-18 11:32:11.046Z",
    "updated": "2024-08-18 11:32:11.046Z",
    "name": "models",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "elya7ksn",
        "name": "name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "3st29imr",
        "name": "elementsCreated",
        "type": "relation",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "p2swtftfbdxdkie",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": null,
          "displayFields": null
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("mrxkweem2ybaleb");

  return dao.deleteCollection(collection);
})
