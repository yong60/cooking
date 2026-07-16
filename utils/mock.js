const appInfo = {
  "name": "\u80e1\u95f9\u53a8\u623f",
  "slogan": "\u4eca\u5929\u5403\u4ec0\u4e48\uff0c\u4e00\u8d77\u80e1\u95f9\u51fa\u4e00\u684c\u597d\u83dc",
  "coupleName": "\u6211\u4eec\u7684\u80e1\u95f9\u5c0f\u996d\u684c"
}

const recipeCategories = [
  {
    "id": "home",
    "name": "\u5bb6\u5e38\u83dc",
    "icon": "\ud83c\udfe0"
  },
  {
    "id": "meat",
    "name": "\u8089\u83dc",
    "icon": "\ud83e\udd69"
  },
  {
    "id": "vegetable",
    "name": "\u7d20\u83dc",
    "icon": "\ud83e\udd57"
  },
  {
    "id": "staple",
    "name": "\u4e3b\u98df",
    "icon": "\ud83c\udf5a"
  },
  {
    "id": "soup",
    "name": "\u6c64\u7fb9",
    "icon": "\ud83c\udf72"
  }
]

const recipes = [
  {
    "id": "r001",
    "categoryId": "home",
    "name": "\u756a\u8304\u7092\u86cb",
    "desc": "\u9178\u751c\u4e0b\u996d\uff0c\u5341\u5206\u949f\u5feb\u624b\u83dc\u3002",
    "ingredients": [
      "i001",
      "i018",
      "i030"
    ],
    "tags": [
      "\u5feb\u624b",
      "\u4e0b\u996d"
    ],
    "cover": "01"
  },
  {
    "id": "r002",
    "categoryId": "meat",
    "name": "\u53ef\u4e50\u9e21\u7fc5",
    "desc": "\u751c\u54b8\u53e3\uff0c\u9002\u5408\u5468\u672b\u52a0\u9910\u3002",
    "ingredients": [
      "i006",
      "i035",
      "i034"
    ],
    "tags": [
      "\u4eba\u6c14",
      "\u8089\u83dc"
    ],
    "cover": "02"
  },
  {
    "id": "r003",
    "categoryId": "meat",
    "name": "\u9752\u6912\u8089\u4e1d",
    "desc": "\u7ecf\u5178\u5bb6\u5e38\u83dc\uff0c\u914d\u7c73\u996d\u5f88\u5408\u9002\u3002",
    "ingredients": [
      "i004",
      "i019",
      "i030"
    ],
    "tags": [
      "\u4e0b\u996d"
    ],
    "cover": "03"
  },
  {
    "id": "r004",
    "categoryId": "vegetable",
    "name": "\u849c\u84c9\u897f\u5170\u82b1",
    "desc": "\u6e05\u723d\u7d20\u83dc\uff0c\u9002\u5408\u642d\u914d\u8089\u83dc\u3002",
    "ingredients": [
      "i023",
      "i030"
    ],
    "tags": [
      "\u6e05\u723d",
      "\u7d20\u83dc"
    ],
    "cover": "04"
  },
  {
    "id": "r005",
    "categoryId": "home",
    "name": "\u571f\u8c46\u7096\u725b\u8169",
    "desc": "\u8f6f\u7cef\u6d53\u9999\uff0c\u9002\u5408\u6162\u6162\u7096\u3002",
    "ingredients": [
      "i005",
      "i015",
      "i016"
    ],
    "tags": [
      "\u786c\u83dc"
    ],
    "cover": "05"
  },
  {
    "id": "r006",
    "categoryId": "vegetable",
    "name": "\u624b\u6495\u5305\u83dc",
    "desc": "\u7b80\u5355\u5f00\u80c3\uff0c\u665a\u996d\u5e38\u5907\u3002",
    "ingredients": [
      "i021",
      "i030"
    ],
    "tags": [
      "\u5feb\u624b"
    ],
    "cover": "06"
  },
  {
    "id": "r007",
    "categoryId": "staple",
    "name": "\u86cb\u7092\u996d",
    "desc": "\u51b0\u7bb1\u5269\u996d\u6551\u661f\u3002",
    "ingredients": [
      "i001",
      "i028",
      "i031"
    ],
    "tags": [
      "\u4e3b\u98df",
      "\u5feb\u624b"
    ],
    "cover": "07"
  },
  {
    "id": "r008",
    "categoryId": "home",
    "name": "\u9ebb\u5a46\u8c46\u8150",
    "desc": "\u9999\u8fa3\u4e0b\u996d\uff0c\u53ef\u6309\u53e3\u5473\u51cf\u8fa3\u3002",
    "ingredients": [
      "i013",
      "i004",
      "i036"
    ],
    "tags": [
      "\u4e0b\u996d",
      "\u5fae\u8fa3"
    ],
    "cover": "08"
  },
  {
    "id": "r009",
    "categoryId": "soup",
    "name": "\u7d2b\u83dc\u86cb\u82b1\u6c64",
    "desc": "\u51e0\u5206\u949f\u5c31\u80fd\u5b8c\u6210\u7684\u914d\u6c64\u3002",
    "ingredients": [
      "i001",
      "i026"
    ],
    "tags": [
      "\u6c64",
      "\u5feb\u624b"
    ],
    "cover": "09"
  },
  {
    "id": "r010",
    "categoryId": "soup",
    "name": "\u756a\u8304\u8c46\u8150\u6c64",
    "desc": "\u6e05\u6de1\u6696\u80c3\uff0c\u9002\u5408\u914d\u996d\u3002",
    "ingredients": [
      "i018",
      "i013"
    ],
    "tags": [
      "\u6c64",
      "\u6e05\u6de1"
    ],
    "cover": "10"
  },
  {
    "id": "r011",
    "categoryId": "meat",
    "name": "\u6d0b\u8471\u7092\u725b\u8089",
    "desc": "\u9999\u6c14\u8db3\uff0c\u9002\u5408\u60f3\u5403\u8089\u7684\u65f6\u5019\u3002",
    "ingredients": [
      "i005",
      "i017",
      "i030"
    ],
    "tags": [
      "\u8089\u83dc"
    ],
    "cover": "11"
  },
  {
    "id": "r012",
    "categoryId": "vegetable",
    "name": "\u9999\u83c7\u9752\u83dc",
    "desc": "\u6e05\u6de1\u4f46\u6709\u9c9c\u5473\u3002",
    "ingredients": [
      "i025",
      "i022"
    ],
    "tags": [
      "\u7d20\u83dc"
    ],
    "cover": "12"
  }
]

const ingredientCategories = [
  {
    "id": "meat",
    "name": "\u8089\u79bd\u86cb",
    "icon": "\ud83e\udd5a"
  },
  {
    "id": "seafood",
    "name": "\u6c34\u4ea7",
    "icon": "\ud83e\udd90"
  },
  {
    "id": "veg",
    "name": "\u852c\u83dc",
    "icon": "\ud83e\udd66"
  },
  {
    "id": "soy",
    "name": "\u8c46\u5236\u54c1",
    "icon": "\ud83e\uded8"
  },
  {
    "id": "staple",
    "name": "\u4e3b\u98df",
    "icon": "\ud83c\udf5a"
  },
  {
    "id": "mushroom",
    "name": "\u83cc\u83c7",
    "icon": "\ud83c\udf44"
  },
  {
    "id": "seasoning",
    "name": "\u8c03\u6599",
    "icon": "\ud83e\uddc2"
  }
]

const ingredients = [
  {
    "id": "i001",
    "categoryId": "meat",
    "name": "\u9e21\u86cb",
    "emoji": "\ud83e\udd5a"
  },
  {
    "id": "i002",
    "categoryId": "meat",
    "name": "\u9e21\u80f8\u8089",
    "emoji": "\ud83d\udc14"
  },
  {
    "id": "i003",
    "categoryId": "meat",
    "name": "\u9e21\u817f",
    "emoji": "\ud83c\udf57"
  },
  {
    "id": "i004",
    "categoryId": "meat",
    "name": "\u732a\u8089",
    "emoji": "\ud83d\udc37"
  },
  {
    "id": "i005",
    "categoryId": "meat",
    "name": "\u725b\u8089",
    "emoji": "\ud83d\udc2e"
  },
  {
    "id": "i006",
    "categoryId": "meat",
    "name": "\u9e21\u7fc5",
    "emoji": "\ud83c\udf57"
  },
  {
    "id": "i007",
    "categoryId": "seafood",
    "name": "\u867e\u4ec1",
    "emoji": "\ud83e\udd53"
  },
  {
    "id": "i008",
    "categoryId": "seafood",
    "name": "\u9c7c\u7247",
    "emoji": "\ud83e\udd90"
  },
  {
    "id": "i009",
    "categoryId": "seafood",
    "name": "\u5e26\u9c7c",
    "emoji": "\ud83d\udc1f"
  },
  {
    "id": "i010",
    "categoryId": "seafood",
    "name": "\u82b1\u7532",
    "emoji": "\ud83e\udd91"
  },
  {
    "id": "i013",
    "categoryId": "soy",
    "name": "\u8c46\u8150",
    "emoji": "\u25fb"
  },
  {
    "id": "i014",
    "categoryId": "soy",
    "name": "\u8150\u7af9",
    "emoji": "\ud83e\uded8"
  },
  {
    "id": "i015",
    "categoryId": "veg",
    "name": "\u571f\u8c46",
    "emoji": "\ud83e\udd54"
  },
  {
    "id": "i016",
    "categoryId": "veg",
    "name": "\u80e1\u841d\u535c",
    "emoji": "\ud83e\udd55"
  },
  {
    "id": "i017",
    "categoryId": "veg",
    "name": "\u6d0b\u8471",
    "emoji": "\ud83e\uddc5"
  },
  {
    "id": "i018",
    "categoryId": "veg",
    "name": "\u897f\u7ea2\u67ff",
    "emoji": "\ud83c\udf45"
  },
  {
    "id": "i019",
    "categoryId": "veg",
    "name": "\u9752\u6912",
    "emoji": "\ud83e\uded1"
  },
  {
    "id": "i020",
    "categoryId": "veg",
    "name": "\u8304\u5b50",
    "emoji": "\ud83e\udd52"
  },
  {
    "id": "i021",
    "categoryId": "veg",
    "name": "\u5305\u83dc",
    "emoji": "\ud83e\udd6c"
  },
  {
    "id": "i022",
    "categoryId": "veg",
    "name": "\u9752\u83dc",
    "emoji": "\ud83e\udd6c"
  },
  {
    "id": "i023",
    "categoryId": "veg",
    "name": "\u897f\u5170\u82b1",
    "emoji": "\ud83e\udd66"
  },
  {
    "id": "i024",
    "categoryId": "veg",
    "name": "\u9ec4\u74dc",
    "emoji": "\ud83c\udf46"
  },
  {
    "id": "i025",
    "categoryId": "mushroom",
    "name": "\u9999\u83c7",
    "emoji": "\ud83c\udf44"
  },
  {
    "id": "i026",
    "categoryId": "seasoning",
    "name": "\u7d2b\u83dc",
    "emoji": "\ud83c\udf3f"
  },
  {
    "id": "i027",
    "categoryId": "staple",
    "name": "\u9762\u6761",
    "emoji": "\ud83c\udf3d"
  },
  {
    "id": "i028",
    "categoryId": "staple",
    "name": "\u7c73\u996d",
    "emoji": "\ud83c\udf5a"
  },
  {
    "id": "i029",
    "categoryId": "staple",
    "name": "\u5e74\u7cd5",
    "emoji": "\ud83c\udf5c"
  },
  {
    "id": "i030",
    "categoryId": "seasoning",
    "name": "\u5927\u849c",
    "emoji": "\ud83e\uddc4"
  },
  {
    "id": "i031",
    "categoryId": "seasoning",
    "name": "\u5c0f\u8471",
    "emoji": "\ud83e\uddc5"
  },
  {
    "id": "i032",
    "categoryId": "seasoning",
    "name": "\u59dc",
    "emoji": "\ud83c\udf36\ufe0f"
  },
  {
    "id": "i033",
    "categoryId": "seasoning",
    "name": "\u751f\u62bd",
    "emoji": "\ud83e\udeda"
  },
  {
    "id": "i034",
    "categoryId": "seasoning",
    "name": "\u8001\u62bd",
    "emoji": "\ud83e\uddc2"
  },
  {
    "id": "i035",
    "categoryId": "seasoning",
    "name": "\u53ef\u4e50",
    "emoji": "\ud83e\udd64"
  },
  {
    "id": "i036",
    "categoryId": "seasoning",
    "name": "\u8c46\u74e3\u9171",
    "emoji": "\ud83c\udf36\ufe0f"
  }
]

module.exports = { appInfo, recipeCategories, recipes, ingredientCategories, ingredients }
