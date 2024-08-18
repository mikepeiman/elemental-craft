/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("p2swtftfbdxdkie")

  // remove
  collection.schema.removeField("2cyfjdny")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "omf0d8jh",
    "name": "parents",
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
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("p2swtftfbdxdkie")

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  // remove
  collection.schema.removeField("omf0d8jh")

  return dao.saveCollection(collection)
})
