```
+-----------------+        +----------------+        +---------------+        +-------------+        +-------------+        +-----------+        +----------+
|      User       |        |   StoreUser    |        |    Store      |        |  Customer   |        |    Utang    |        | UtangItem |        |  Payment |
+-----------------+        +----------------+        +---------------+        +-------------+        +-------------+        +-----------+        +----------+
|  id (PK)        |<-----o |  id (PK)       | o----->| id (PK)       |<-----o | id (PK)     |<-----o | id (PK)     |<-----o | id (PK)   |        | id (PK)  |
|  ...            |        |  userId (FK)   |        | name          |        | storeId (FK)|        | customerId  |        | utangId   |        | utangId  |
|                 |        |  storeId (FK)  |        | ...           |        | ...         |        | ...         |        | itemId    |        | ...      |
|                 |        |  role          |        |               |        |             |        |             |        | quantity  |        |          |
+-----------------+        +----------------+        +---------------+        +-------------+        +-------------+        | unitPrice |        |          |
                                                                ^                                     | ...      |
                                                                |                                     +----------+
                                                          +-------------+
                                                          |   Item      |
                                                          +-------------+
                                                          | id (PK)     |
                                                          | storeId (FK)|
                                                          | ...         |
                                                          +-------------+

Legend:
- PK: Primary Key
- FK: Foreign Key
- o----< : One-to-many
- >----< : Many-to-many (via join table)

User ──< StoreUser >── Store
Store ──< Customer
Store ──< Item
Customer ──< Utang
Utang ──< UtangItem >── Item
Utang ──< Payment

```
