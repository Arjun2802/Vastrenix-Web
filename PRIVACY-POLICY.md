# VASTRENIX — PRIVACY POLICY

**Effective Date:** October 30, 2026  
**Last Updated:** October 30, 2026  
**Public Hosted URL (Play Store):** [https://arjun2802.github.io/vastrenix-fabric-engine/privacy.html](https://arjun2802.github.io/vastrenix-fabric-engine/privacy.html)  
**Repository Source:** [https://github.com/Arjun2802/vastrenix-fabric-engine/blob/main/PRIVACY-POLICY.md](https://github.com/Arjun2802/vastrenix-fabric-engine/blob/main/PRIVACY-POLICY.md)  
**Contact & Grievance Desk:** [contact@vastrenix.com](mailto:contact@vastrenix.com)  

---

> [!WARNING]
> **LEGAL REVIEW ADVISORY:**
> This privacy policy is drafted specifically for the actual architecture and feature set of the VASTRENIX B2B garment management application in compliance with India's **Digital Personal Data Protection Act (DPDPA), 2023**, the **Information Technology Act, 2000**, and the **Central Goods and Services Tax (CGST) Act, 2017**. This document should be formally reviewed by a qualified legal professional familiar with Indian commercial and data privacy law prior to publication, especially regarding the statutory tax-data retention periods and the Dealer Network B2B data-sharing provisions.

---

## 1. Introduction & Overview

**Vastrenix** (“we”, “us”, “our”, or “the Platform”) is a specialized business-to-business (B2B) Point-of-Sale (POS), inventory management, and wholesale dealer networking platform developed for the apparel and textile trade in India. Vastrenix serves garment retail stores, designer boutiques, wholesale textile merchants, garment manufacturers, and authorized dealer networks.

This Privacy Policy explains how personal data and business information are collected, processed, shared, stored, and protected when business owners (“Merchants”), authorized employees (“Staff Members”), and wholesale partners (“Dealers”) download, access, or use the Vastrenix mobile application, Android WebView client, web application, and related services (collectively, the “Services”).

By registering an account, creating a business profile, or utilizing any feature of Vastrenix, you acknowledge and agree to the practices outlined in this Privacy Policy.

---

## 2. Categories of Data Collected

Vastrenix collects only the data strictly necessary to deliver specialized garment billing, inventory tracking, and dealer supply-chain functionality. We do not collect extraneous tracking data or engage in behavioral advertising.

### A. Staff & User Account Information
- **Personal Identifiers:** Full legal name, mobile phone number, and business email address.
- **Role & Authorization:** Designated staff role (e.g., Business Owner, Store Manager, Biller / Cashier, Inventory Stockist, Auditor / Read-Only).
- **Assigned Work Location:** Designated physical shop counter, branch showroom, or godown / warehouse.
- **Authentication Metadata:** Secure authentication tokens, login timestamps, and device session IDs managed via Firebase Authentication.

### B. Customer Records (Customer Khata / Ledger)
- **Customer Identifiers:** Name and 10-digit mobile phone number provided during retail counter checkout or ledger entry.
- **Transaction & Credit History:** Cumulative purchases, sales invoices issued, items purchased, returns, credit notes, and payment receipts.
- **Store Credit & Due Balances:** Outstanding khata balances, agreed payment due dates, and month-end settlement reminders.

### C. Business Profile & Branch Information
- **Business Identity:** Legal entity name, trade name, brand logo, and business description.
- **Tax & Regulatory Details:** Goods and Services Tax Identification Number (**GSTIN**), tax state code, and registered composition or regular tax scheme details.
- **Physical Locations:** Complete addresses of retail counters, main showrooms, and separate storage godowns.
- **Payment Identifiers:** Merchant UPI Virtual Payment Address (VPA) / UPI ID and static QR code images for customer checkout.

### D. Transactional, Inventory & Financial Data
- **Point-of-Sale Records:** Sales invoices, line-item breakdowns (garment type, size, color variant, SKU, barcode, unit price, applied discount, and CGST/SGST/IGST tax rates).
- **Payment Records:** Tendered amounts, payment modalities (Cash, UPI, Debit/Credit Card, Split Payment, Store Credit / Due), and 12-digit UPI Unique Transaction Reference (**UTR**) numbers.
- **Inventory Ledger:** Garment variant stock levels, warehouse-to-shop transfer challans, physical stock count audit entries, supplier purchase orders (POs), goods received notes (GRNs), and supplier ledger balances.

### E. User-Uploaded Content
- **Garment Catalog Media:** Product swatch photographs, garment catalog images, and shop logos uploaded via the device gallery or camera.
- **Payment Assets:** Merchant UPI QR code graphics uploaded to display on thermal and digital invoices.

---

## 3. Purpose & Legal Basis for Data Processing

We process personal and transactional data under lawful bases recognized by the DPDPA 2023, specifically for the performance of our contract with you, compliance with statutory tax obligations, and legitimate commercial operations:

1. **Point-of-Sale Billing & Invoice Generation:** To calculate CGST, SGST, and IGST accurately, generate print-ready thermal receipts (58mm/80mm), format standardized A4/A5 PDF invoices, and facilitate direct digital invoice delivery via WhatsApp.
2. **Multi-Location Inventory Management:** To synchronize garment inventory across physical stores and warehouses in real time, preventing double-selling across multiple checkout counters.
3. **Customer Credit Management (Khata):** To record customer dues, compute ledger balances, issue payment acknowledgments, and assist merchants with month-end payment reconciliations.
4. **B2B Dealer Network Fulfillment:** To allow authorized retailers and wholesalers to exchange purchase orders, verify product catalogs, confirm tiered wholesale pricing, and track order fulfillment status.
5. **Security, Fraud Prevention & Auditability:** To maintain immutable transaction logs, prevent unauthorized employee access, and safeguard business data integrity.
6. **Customer Support & Service Improvement:** To respond to help requests, troubleshoot technical bugs, and communicate vital system notifications.

---

## 4. Storage, Hosting & Processing Infrastructure

Vastrenix utilizes enterprise-grade cloud infrastructure provided by **Google Cloud Platform (GCP)** and **Firebase** to store and process all application data:

- **Firebase Authentication:** Secure credential management and token-based user verification.
- **Cloud Firestore:** Distributed NoSQL database providing encrypted multi-tenant data isolation and real-time counter synchronization.
- **Firebase Cloud Storage:** Encrypted object storage for uploaded merchant logos, UPI QR codes, and garment images.

All data is encrypted in transit using **TLS 1.3 / HTTPS** and encrypted at rest using **AES-256 bit encryption**. Google Cloud maintains compliance with global standards including ISO/IEC 27001, SOC 1, SOC 2, and SOC 3. For further information, review [Google Cloud’s Data Processing and Security Terms](https://cloud.google.com/terms/data-processing-terms).

---

## 5. Payment Processing & Subscription Billing

Vastrenix offers paid software subscriptions for multi-branch sync and commercial operations. 

- Subscription billing is processed exclusively through **Razorpay Software Private Limited** (“Razorpay”).
- **No Card or Banking Credential Storage:** Vastrenix **does not** collect, transmit, or store credit card numbers, debit card numbers, CVVs, net-banking passwords, or UPI MPINs. All sensitive payment details are entered directly into Razorpay’s secure, PCI-DSS Level 1 compliant checkout interface.
- Razorpay provides Vastrenix with non-sensitive transaction confirmation identifiers, subscription status, and payment cycle metadata. For details regarding Razorpay’s privacy practices, please refer to the [Razorpay Privacy Policy](https://razorpay.com/privacy/).

---

## 6. Dealer Network Data Sharing (Explicit Disclosure)

Vastrenix features a **B2B Dealer Network** that allows clothing retailers to connect directly with authorized garment wholesalers, mills, and manufacturers. We provide explicit disclosure regarding how data is shared across this feature:

1. **Affirmative Mutual Connection Required:** Data is never shared publicly or made searchable to unauthorized third parties. Both businesses must explicitly exchange and accept a mutual digital connection.
2. **Strictly Scoped Order Information:** When a connection is established, data shared is strictly confined to purchase order execution:
   - Specific products ordered (garment titles, variants, sizes, and colors).
   - Order quantities and agreed dealer/wholesale tier prices.
   - Dispatch status, tracking information, and fulfillment timestamps.
   - Relevant merchant business contact details necessary for delivery logistics.
3. **Strict Confidentiality of Internal Operations:** Connecting businesses **can never** view your internal retail bills, customer khata balances, profit margins, overall revenue, individual cashier performance, or inventory located at unconnected branches.

---

## 7. Data Retention & Mandatory Indian GST Compliance

Data retention in Vastrenix is governed by operational necessity and mandatory statutory compliance under Indian tax law:

- **Statutory Retention of Financial & Tax Records (6 Years / 72 Months):**  
  Under **Section 36 of the Central Goods and Services Tax (CGST) Act, 2017**, every registered taxable person is required to maintain true and correct accounts and records (including tax invoices, bills of supply, credit/debit notes, and inventory records) for at least **72 months (6 years)** from the due date of furnishing the annual return for the financial year pertaining to such accounts and records. In compliance with Indian tax regulations, posted sales invoices, credit notes, and associated financial ledger records cannot be permanently purged during this statutory period.
- **Account & Operational Data:**  
  Non-financial operational records, staff accounts, draft documents, and merchant configuration settings are retained for as long as the merchant maintains an active account with Vastrenix, or until a formal deletion request is executed.
- **Inactive Accounts:**  
  Upon account termination or cancellation, active subscriptions transition to expired status. Merchants retain read-only access to download past tax invoices and records as mandated by law.

---

## 8. User Rights under the Digital Personal Data Protection Act (DPDPA), 2023

In accordance with India’s **Digital Personal Data Protection Act, 2023 (DPDPA)**, Data Principals (business owners, staff members, and customers whose information is processed) enjoy the following rights:

1. **Right to Access & Summary:** You have the right to request a summary of the personal data held about you and the processing activities undertaken.
2. **Right to Correction & Updating:** You have the right to correct inaccurate, outdated, or incomplete personal data. Store owners and staff can update their business profile, product details, and contact information directly in the application settings.
3. **Right to Erasure / Deletion:** You have the right to request the erasure of your personal data. We will delete or anonymize eligible personal information upon verification, **except** where retention is mandated by law (such as the 6-year GST invoice retention rule stipulated under Section 36 of the CGST Act).
4. **Right to Grievance Redressal:** If you have questions, concerns, or unresolved issues regarding the handling of your data, you may lodge a formal grievance with our dedicated Grievance Desk.

### How to Exercise Your Rights:
To exercise any of these statutory rights, send a written request from your registered email address to **[contact@vastrenix.com](mailto:contact@vastrenix.com)** with the subject line `"DPDPA Data Request"`. We will acknowledge your communication within **48 business hours** and complete verifiable requests within **30 calendar days**.

---

## 9. Children’s Privacy

Vastrenix is exclusively a B2B commercial productivity tool designed for adult business owners, retail shop employees, and commercial traders. The application is **not directed to, marketed to, or intended for use by anyone under the age of 18**. We do not knowingly collect personal data from minors. If we discover that personal data of an individual under 18 has been inadvertently gathered, it will be deleted immediately.

---

## 10. Security Measures & Tenant Isolation

We employ strict administrative, technical, and physical security measures to safeguard your commercial data:

- **Multi-Tenant Isolation:** Database architecture is partitioned by unique business identifiers (`businessId`). Firestore security rules strictly prevent one merchant from reading or writing another merchant's inventory, invoices, or customer ledger.
- **Role-Based Access Control (RBAC):** Access permissions within a merchant account are segmented by staff roles (e.g., Cashiers cannot alter past finalized invoices, view profit margins, or modify store tax settings).
- **Network Security:** All external communication between the Android WebView shell, web SPA, and backend services takes place over HTTPS/TLS encryption.
- **Client Sandbox Protection:** The Android native wrapper operates within standard Android application sandboxing with minimal system permissions (no background location tracking, no silent camera usage).

---

## 11. Changes to this Privacy Policy

We may update this Privacy Policy from time to time to reflect enhancements in our service features, security protocols, or changes in statutory Indian laws. When material modifications are made:
- We will update the **“Last Updated”** date at the top of this document.
- We will display a clear notification within the Vastrenix application (in the More / Notifications section) prior to the changes taking effect.
- The most up-to-date version will always remain accessible in-app and at our public hosted URL.

---

## 12. Contact & Grievance Officer

In accordance with the Information Technology Act, 2000, and the DPDPA 2023, the contact details of our Data Grievance Officer are provided below:

- **Attn:** Data Protection & Grievance Desk  
- **Entity:** Vastrenix Garment Technologies  
- **Email:** [contact@vastrenix.com](mailto:contact@vastrenix.com)  
- **Location:** Gujarat, India  
- **Response Commitment:** Initial acknowledgment within 48 business hours; resolution within 30 days.
