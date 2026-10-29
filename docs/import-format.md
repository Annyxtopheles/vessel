# Vessel Item Import Format Specification

This document details the JSON and CSV schemas for importing items into Vessel. Imports are designed to be machine-friendly and idempotent via `external_id`.

---

## 1. Schema Fields

| Field Name | Type | Required | Allowed Values / Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `external_id` | String | Recommended | Unique string (e.g., `item-macbook-pro-14`) | Stable identifier enabling idempotent re-imports. |
| `name` | String | **Yes** | Text (e.g., `Mechanical Keyboard 75%`) | Display name of the item. |
| `brand` | String | No | Text (e.g., `Keychron`, `Patagonia`) | Manufacturer or designer brand. |
| `category` | String | **Yes** | `apparel`, `tech`, `tomes`, `edc` | Primary category classification. |
| `location` | String | No | Text (e.g., `Desk`, `Closet`, `Travel Pack`) | Physical or storage location. |
| `quantity` | Number | No | Positive integer (defaults to `1`) | Number of units possessed. |
| `status` | String | **Yes** | `owned`, `wanted`, `former` | Ownership state (`wanted` maps to wishlist; `former` maps to past). |
| `colors` | Array / String | No | JSON: `[{"name":"Black","hex":"#1A1A1A"}]`<br>CSV: `Black:#1A1A1A;Charcoal:#2C2C2E` | Associated color palette values. |
| `size` | String | No | Text (e.g., `M`, `42 EU`, `14-inch`) | Dimensions or garment size. |
| `condition` | String | No | `pristine`, `seasoned`, `worn`, `needs_repair` | Current physical state (default: `pristine`). |
| `price_paid` | Number | No | Numeric value (e.g. `12500` or `120.00`) | Original purchase price paid. |
| `current_value` | Number | No | Numeric value (e.g. `10000` or `95.00`) | Current replacement value or estimated worth. |
| `acquired_date` | String | No | `YYYY-MM-DD` | Date acquired. |
| `left_date` | String | No | `YYYY-MM-DD` | Date parted with (if status is `former`). |
| `left_reason` | String | No | `sold`, `gifted`, `donated`, `retired`, `lost` | Reason for departure (if status is `former`). |
| `notes` | String | No | Text or Markdown | Lore, specifications, or notes. |
| `tags` | Array / String | No | JSON: `["edc", "tools"]`<br>CSV: `edc,tools` | Categorization tags. |
| `photo` | String | No | File path, data URI, or URL | Image source. |

---

## 2. Duplicate Resolution Strategies

When importing items with an existing `external_id`:
1. **Skip (`skip`)**: Keep the existing local item unchanged and ignore the incoming record.
2. **Overwrite (`overwrite`)**: Update all matching fields on the existing item, preserving local history and incrementing its revision.
3. **Create New (`create_new`)**: Ignore ID matching and generate a brand new record with a new UUID.

---

## 3. JSON Example

```json
[
  {
    "external_id": "item-edc-pen-01",
    "name": "Titanium Bolt-Action Pen",
    "brand": "Tactile Turn",
    "category": "edc",
    "location": "Desk",
    "quantity": 1,
    "status": "owned",
    "colors": [
      { "name": "Raw Titanium", "hex": "#8C8C91" }
    ],
    "size": "Standard 5.6-inch",
    "condition": "seasoned",
    "price_paid": 99.00,
    "current_value": 90.00,
    "acquired_date": "2024-03-15",
    "notes": "Grade 5 titanium bolt-action ballpoint loaded with 0.5mm Schmidt EasyFlow 9000.",
    "tags": ["edc", "stationery", "titanium"]
  }
]
```

---

## 4. CSV Example

Header row must match the schema field names. Delimit multi-value colors with semicolons (`Name:#HEX;Name2:#HEX`) and tags with commas:

```csv
external_id,name,brand,category,location,quantity,status,colors,size,condition,price_paid,current_value,acquired_date,left_date,left_reason,notes,tags,photo
item-edc-pen-01,"Titanium Bolt-Action Pen","Tactile Turn",edc,Desk,1,owned,Raw Titanium:#8C8C91,Standard 5.6-inch,seasoned,99.00,90.00,2024-03-15,,,Grade 5 titanium bolt-action,"edc,stationery,titanium",
```
