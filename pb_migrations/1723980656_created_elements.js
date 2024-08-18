/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "p2swtftfbdxdkie",
    "created": "2024-08-18 11:30:56.956Z",
    "updated": "2024-08-18 11:30:56.956Z",
    "name": "elements",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "qtdr7ryh",
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
        "id": "2cyfjdny",
        "name": "parents",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "7046ra1k",
        "name": "alternateNames",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
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
  const collection = dao.findCollectionByNameOrId("p2swtftfbdxdkie");

  return dao.deleteCollection(collection);
})
