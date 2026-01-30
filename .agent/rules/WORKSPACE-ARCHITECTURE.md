---
trigger: model_decision
description: This MD outlines a Workspace-First architecture for hierarchical systems. It treats every node as a unique key, using a Scoped Client to auto-filter data. It ensures secure, multi-level access (Admin/Parent/Student) via a single user account.
---

# 🗺️ Workspace-First Architecture Roadmap

## 1. Entity Structure (The Tree)
The system is built on a hierarchy of Workspaces rather than a rigid "user-to-organization" link.

* **Workspace:** A space with a unique key `workspace_access_key` (e.g., `math_school.std_777`).
* **parent_workspace_id:** A reference to the parent node (creates the tree structure).
* **ui_type:** Defines the interface (e.g., `student_learning`, `parent_monitor`, `organization_admin`).
* **Account:** The user's identity (Email, Password).
* **Membership:** Links an **Account** to a **Workspace** + assigns a **Role**.

---

## 2. Interface Types and Access Logic
We decouple "Where I am" (the URL/Workspace) from "What I see" (the UI/Permissions).

| Interface (`ui_type`) | Access Context | Target User |
| :--- | :--- | :--- |
| **Organization Admin** | Entire school root | Teachers, Directors |
| **Student Learning** | Personal node `school.std_id` | Students (and Parents as viewers) |
| **Parent Monitor** | Own hub + child nodes | Parents (data aggregator) |
| **Global Staff** | Entire database | Developers / System Admins |

---

## 3. Authorization Mechanism (Context Flow)
Permission validation process for every request:

1.  **Middleware / Layout:** Extracts the `workspace_key` from the URL.
2.  **Auth Context (`getAuthContext`):**
    * Queries DB/Redis: "Who is this user within this workspace?"
    * Generates a list of `allowedKeys` (for a student, it's one; for a parent, a list of children's keys).
    * Caches the result via React `cache()` for the duration of the render.
3.  **Permission Check:** Validates the user's action against the `permissions` list defined in their role.

---

## 4. Automatic Data Filtering (`getScopedDb`)
To avoid writing `WHERE` clauses manually, we use a **Scoped Client** layer.

* **For Students:** Auto-filter `WHERE workspace_access_key = 'active_key'`.
* **For Parents:** Auto-filter `WHERE workspace_access_key IN ('child_key_1', 'child_key_2')`.
* **For Staff:** No filter applied.

>