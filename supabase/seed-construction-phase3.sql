-- ============================================================
-- SEED DATA — Phase 3 Construction tables
-- Company: 9cbe0947-2335-4254-8dfa-58d15381fbe2 (shatab, EGP)
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 1. WORKER ATTENDANCE / TIMESHEET (con_worker_logs)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO con_worker_logs (company_id, project_id, worker_id, log_date, days_worked, amount_paid, notes) VALUES
-- Project 1 (active) — May 2026 attendance
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-05-01', 1.0, 250, 'عمل أساسات'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '7d547cec-46a9-46b5-b9ad-3256ca242ff6', '2026-05-01', 1.0, 302, 'تبليط'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '43e82549-8178-4553-8ae7-9d5645827036', '2026-05-01', 1.0, 310, 'بناء جدران'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-05-02', 1.0, 250, NULL),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '7d547cec-46a9-46b5-b9ad-3256ca242ff6', '2026-05-02', 0.5, 151, 'نصف يوم'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', 'e72b5187-93e6-4c58-b910-4368108f6e8e', '2026-05-02', 1.0, 215, 'دهان غرف'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '39ee40ed-9121-4e47-8b15-4cc94940dbf0', '2026-05-03', 1.0, 299, 'دهان واجهة'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '71c945a4-6808-4146-bc8a-bb2944e6ffb6', '2026-05-03', 1.0, 280, 'تمديد كهرباء'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '49d6ea86-7ad8-4c66-b345-77ad590a5a43', '2026-05-03', 1.0, 190, 'سباكة حمامات'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-05-04', 1.0, 250, NULL),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '1f616c8b-ab0b-431a-8606-9cb97cb0ffa4', '2026-05-04', 1.0, 168, 'نجارة'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '7992c2a5-1cda-4b76-ad16-ecbbee54804d', '2026-05-04', 1.0, 408, 'إشراف'),

-- Project 2 (active) — multiple workers
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', 'a125637e-5b48-4db1-9392-9c2f14d6eb55', '2026-05-05', 1.0, 291, 'كهرباء'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', '71c945a4-6808-4146-bc8a-bb2944e6ffb6', '2026-05-05', 1.0, 280, 'تمديد أسلاك'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-05-05', 1.0, 250, 'بناء'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', 'a125637e-5b48-4db1-9392-9c2f14d6eb55', '2026-05-06', 1.0, 291, NULL),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', '49d6ea86-7ad8-4c66-b345-77ad590a5a43', '2026-05-06', 1.0, 190, 'سباكة مطبخ'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', '1f616c8b-ab0b-431a-8606-9cb97cb0ffa4', '2026-05-06', 0.5, 84, 'نصف يوم'),

-- Project 3 (completed) — older records
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-04-20', 1.0, 250, 'تشطيب'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', 'e72b5187-93e6-4c58-b910-4368108f6e8e', '2026-04-20', 1.0, 215, 'دهان'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', '7d547cec-46a9-46b5-b9ad-3256ca242ff6', '2026-04-20', 1.0, 302, 'تبليط'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-04-21', 1.0, 250, NULL),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', '39ee40ed-9121-4e47-8b15-4cc94940dbf0', '2026-04-21', 1.0, 299, 'دهان نهائي'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', '71c945a4-6808-4146-bc8a-bb2944e6ffb6', '2026-04-22', 1.0, 280, 'تركيب إضاءة'),

-- Recent attendance this week
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-05-15', 1.0, 250, 'أساسات'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '49d6ea86-7ad8-4c66-b345-77ad590a5a43', '2026-05-15', 1.0, 190, 'سباكة'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '71c945a4-6808-4146-bc8a-bb2944e6ffb6', '2026-05-15', 1.0, 280, 'كهرباء'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-05-16', 1.0, 250, NULL),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '1f616c8b-ab0b-431a-8606-9cb97cb0ffa4', '2026-05-16', 1.0, 168, 'نجارة'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', 'e72b5187-93e6-4c58-b910-4368108f6e8e', '2026-05-16', 1.0, 215, 'دهان'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '7992c2a5-1cda-4b76-ad16-ecbbee54804d', '2026-05-16', 1.0, 408, 'إشراف يومي'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '7d547cec-46a9-46b5-b9ad-3256ca242ff6', '2026-05-17', 1.0, 302, 'تبليط أرضيات'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '43e82549-8178-4553-8ae7-9d5645827036', '2026-05-17', 1.0, 310, 'بناء جدران'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-05-17', 1.0, 250, 'تشطيب'),

-- More scattered records
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'a1ddd8c1-1552-44a9-bd00-b406e52660e1', '93b2a8b1-504c-4531-a055-d0aa30c342b8', '2026-05-10', 1.0, 287, 'حدادة'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'a1ddd8c1-1552-44a9-bd00-b406e52660e1', '6c3a7568-b397-4085-8835-7568f70aafe6', '2026-05-10', 1.0, 294, 'حدادة تسليح'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'a1ddd8c1-1552-44a9-bd00-b406e52660e1', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-05-11', 1.0, 250, 'صب خرسانة'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'a1ddd8c1-1552-44a9-bd00-b406e52660e1', '7992c2a5-1cda-4b76-ad16-ecbbee54804d', '2026-05-11', 1.0, 408, 'إشراف'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'dccf81e9-eef0-481b-b922-f793fa07fae5', 'a125637e-5b48-4db1-9392-9c2f14d6eb55', '2026-05-08', 1.0, 291, 'تمديدات'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'dccf81e9-eef0-481b-b922-f793fa07fae5', '49d6ea86-7ad8-4c66-b345-77ad590a5a43', '2026-05-08', 1.0, 190, 'سباكة'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'dccf81e9-eef0-481b-b922-f793fa07fae5', '1f616c8b-ab0b-431a-8606-9cb97cb0ffa4', '2026-05-09', 1.0, 168, 'أبواب'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'dccf81e9-eef0-481b-b922-f793fa07fae5', 'e72b5187-93e6-4c58-b910-4368108f6e8e', '2026-05-09', 1.0, 215, 'دهان'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '40a713b5-942a-4645-b0c0-6eb0ef02eb49', 'b53e1eaa-5dcf-4afe-8200-94cc24438f03', '2026-05-12', 1.0, 306, 'نجارة مطابخ'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '40a713b5-942a-4645-b0c0-6eb0ef02eb49', 'c217d7d4-ee85-40ad-8517-0d70bf4134bf', '2026-05-12', 1.0, 302, 'تركيب'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '919aff01-5e3e-4e21-b765-cd1064d0a6de', '45593d63-0fb8-4a66-bf3a-801eb6c120c4', '2026-05-14', 1.0, 250, 'أعمال أساس'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '919aff01-5e3e-4e21-b765-cd1064d0a6de', '7d547cec-46a9-46b5-b9ad-3256ca242ff6', '2026-05-14', 0.5, 151, 'نصف يوم تبليط');

-- ═══════════════════════════════════════════════════════════════
-- 2. PURCHASE ORDERS (con_purchase_orders)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO con_purchase_orders (company_id, project_id, supplier, order_date, status, total, notes) VALUES
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', 'شركة العمران للبناء', '2026-04-28', 'received', 87500, 'تم الاستلام كاملاً'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', 'مؤسسة الكهرباء المتحدة', '2026-05-01', 'partially_received', 32000, 'استلمنا نصف الكمية'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', 'شركة السالم للسباكة', '2026-05-02', 'sent', 15000, 'في الطريق'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', 'معرض النور للسيراميك', '2026-05-05', 'pending', 45000, 'في انتظار الموافقة'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'a1ddd8c1-1552-44a9-bd00-b406e52660e1', 'شركة الحديد والصلب', '2026-05-06', 'received', 120000, 'حديد تسليح كامل'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', 'مستودع الدهانات الحديثة', '2026-04-25', 'received', 8900, 'دهانات الجدران'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', 'شركة الخرسانة الجاهزة', '2026-05-03', 'cancelled', 65000, 'ألغي لعدم التطابق'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'dccf81e9-eef0-481b-b922-f793fa07fae5', 'مؤسسة النجارة الذهبية', '2026-05-08', 'pending', 28000, 'أبواب وشبابيك'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '40a713b5-942a-4645-b0c0-6eb0ef02eb49', 'شركة الزجاج والمرايا', '2026-05-10', 'sent', 12500, 'زجاج واجهات'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '919aff01-5e3e-4e21-b765-cd1064d0a6de', 'مستودع مواد البناء', '2026-05-12', 'pending', 5300, 'اسمنت ورمل');

-- ═══════════════════════════════════════════════════════════════
-- 3. PURCHASE ORDER ITEMS (con_purchase_order_items)
-- ═══════════════════════════════════════════════════════════════

-- Order 1: شركة العمران للبناء (received) — اسمنت وطوب
INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'أسمنت بورتلاندي', 50, 'bag', 320, 16000 FROM con_purchase_orders WHERE notes = 'تم الاستلام كاملاً' AND supplier = 'شركة العمران للبناء';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'طوب أحمر', 12000, 'unit', 2.5, 30000 FROM con_purchase_orders WHERE notes = 'تم الاستلام كاملاً' AND supplier = 'شركة العمران للبناء';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'رمل أبيض', 15, 'm3', 1800, 27000 FROM con_purchase_orders WHERE notes = 'تم الاستلام كاملاً' AND supplier = 'شركة العمران للبناء';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'بحص', 10, 'm3', 1450, 14500 FROM con_purchase_orders WHERE notes = 'تم الاستلام كاملاً' AND supplier = 'شركة العمران للبناء';

-- Order 2: مؤسسة الكهرباء المتحدة (partially_received)
INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'أسلاك كهرباء 6mm', 500, 'm', 18, 9000 FROM con_purchase_orders WHERE notes = 'استلمنا نصف الكمية' AND supplier = 'مؤسسة الكهرباء المتحدة';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'مفاتيح كهرباء', 200, 'unit', 35, 7000 FROM con_purchase_orders WHERE notes = 'استلمنا نصف الكمية' AND supplier = 'مؤسسة الكهرباء المتحدة';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'لمبات LED', 100, 'unit', 55, 5500 FROM con_purchase_orders WHERE notes = 'استلمنا نصف الكمية' AND supplier = 'مؤسسة الكهرباء المتحدة';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'قواطع كهرباء', 25, 'unit', 420, 10500 FROM con_purchase_orders WHERE notes = 'استلمنا نصف الكمية' AND supplier = 'مؤسسة الكهرباء المتحدة';

-- Order 3: شركة السالم للسباكة (sent)
INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'مواسير PPR 1 إنش', 100, 'm', 25, 2500 FROM con_purchase_orders WHERE notes = 'في الطريق' AND supplier = 'شركة السالم للسباكة';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'خلاطات ماء', 30, 'unit', 250, 7500 FROM con_purchase_orders WHERE notes = 'في الطريق' AND supplier = 'شركة السالم للسباكة';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'شفاطات', 20, 'unit', 180, 3600 FROM con_purchase_orders WHERE notes = 'في الطريق' AND supplier = 'شركة السالم للسباكة';

-- Order 4: معرض النور للسيراميك (pending)
INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'سيراميك أرضيات 60×60', 300, 'm2', 95, 28500 FROM con_purchase_orders WHERE notes = 'في انتظار الموافقة' AND supplier = 'معرض النور للسيراميك';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'بورسلين جدران', 150, 'm2', 110, 16500 FROM con_purchase_orders WHERE notes = 'في انتظار الموافقة' AND supplier = 'معرض النور للسيراميك';

-- Order 5: شركة الحديد والصلب (received)
INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'حديد تسليح 16mm', 5, 'ton', 14000, 70000 FROM con_purchase_orders WHERE notes = 'حديد تسليح كامل' AND supplier = 'شركة الحديد والصلب';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'حديد تسليح 12mm', 4, 'ton', 12500, 50000 FROM con_purchase_orders WHERE notes = 'حديد تسليح كامل' AND supplier = 'شركة الحديد والصلب';

-- Order 6: مستودع الدهانات الحديثة (received)
INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'دهان جدران أبيض', 40, 'liter', 85, 3400 FROM con_purchase_orders WHERE notes = 'دهانات الجدران' AND supplier = 'مستودع الدهانات الحديثة';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'دهان جدران بيج', 30, 'liter', 85, 2550 FROM con_purchase_orders WHERE notes = 'دهانات الجدران' AND supplier = 'مستودع الدهانات الحديثة';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'معجون جدران', 10, 'bag', 295, 2950 FROM con_purchase_orders WHERE notes = 'دهانات الجدران' AND supplier = 'مستودع الدهانات الحديثة';

-- Order 7: شركة الخرسانة الجاهزة (cancelled — don't add items)

-- Order 8: مؤسسة النجارة الذهبية (pending)
INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'أبواب خشب داخلي', 15, 'unit', 950, 14250 FROM con_purchase_orders WHERE notes = 'أبواب وشبابيك' AND supplier = 'مؤسسة النجارة الذهبية';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'شبابيك خشب', 10, 'unit', 850, 8500 FROM con_purchase_orders WHERE notes = 'أبواب وشبابيك' AND supplier = 'مؤسسة النجارة الذهبية';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'إطارات أبواب', 15, 'unit', 350, 5250 FROM con_purchase_orders WHERE notes = 'أبواب وشبابيك' AND supplier = 'مؤسسة النجارة الذهبية';

-- Order 9: شركة الزجاج والمرايا (sent)
INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'زجاج واجهات 10mm', 80, 'm2', 120, 9600 FROM con_purchase_orders WHERE notes = 'زجاج واجهات' AND supplier = 'شركة الزجاج والمرايا';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'سيلكون زجاج', 20, 'unit', 145, 2900 FROM con_purchase_orders WHERE notes = 'زجاج واجهات' AND supplier = 'شركة الزجاج والمرايا';

-- Order 10: مستودع مواد البناء (pending)
INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'اسمنت', 10, 'bag', 320, 3200 FROM con_purchase_orders WHERE notes = 'اسمنت ورمل' AND supplier = 'مستودع مواد البناء';

INSERT INTO con_purchase_order_items (order_id, material_name, quantity, unit, unit_price, total)
SELECT id, 'رمل', 2, 'm3', 1050, 2100 FROM con_purchase_orders WHERE notes = 'اسمنت ورمل' AND supplier = 'مستودع مواد البناء';

-- ═══════════════════════════════════════════════════════════════
-- 4. DAILY PROGRESS REPORTS (con_daily_logs)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO con_daily_logs (company_id, project_id, log_date, weather, workers_count, hours_worked, notes) VALUES
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '2026-05-01', 'sunny', 12, 8, 'تم صب أساسات الدور الأرضي. العمل مستمر حسب الجدول.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '2026-05-02', 'sunny', 10, 7, 'استكمال صب الأعمدة. تم فحص الخرسانة.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '2026-05-03', 'cloudy', 14, 8, 'بدء بناء جدران الطابق الأول. 5 عمال بناء + 2 نجار + 2 حداد.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', '2026-05-04', 'dusty', 8, 6, 'عمل محدود بسبب العاصفة الترابية. تركيب شدات معدنية.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', '2026-05-05', 'sunny', 6, 8, 'تمديد أسلاك الكهرباء في الطابق الأرضي.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', '2026-05-06', 'sunny', 7, 8, 'سباكة المطبخ والحمامات. اختبار ضغط المواسير.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', '2026-04-20', 'sunny', 9, 8, 'دهان جميع الغرف الطبقة الأولى.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', '2026-04-21', 'sunny', 11, 8, 'تبليط أرضيات الدور الأرضي. تم الانتهاء من 70%.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', '2026-04-22', 'sunny', 8, 7, 'أعمال التشطيب النهائي. تركيب الإضاءة.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '2026-05-15', 'sunny', 15, 8, 'بدء المشروع. تم صب الأساسات. جميع العمال في الموقع.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '2026-05-16', 'cloudy', 13, 8, 'استكمال الأساسات. بدء أعمال السباكة والكهرباء.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', '2026-05-17', 'sunny', 14, 8, 'تبليط أرضيات الدور الأرضي. بناء جدران داخلية.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'a1ddd8c1-1552-44a9-bd00-b406e52660e1', '2026-05-10', 'sunny', 8, 8, 'حدادة تسليح الأعمدة والسقف.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'a1ddd8c1-1552-44a9-bd00-b406e52660e1', '2026-05-11', 'hot', 7, 7, 'صب خرسانة السقف. تم الصب بنجاح.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'dccf81e9-eef0-481b-b922-f793fa07fae5', '2026-05-08', 'cloudy', 5, 6, 'أعمال تمديدات صحية وكهربائية.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'dccf81e9-eef0-481b-b922-f793fa07fae5', '2026-05-09', 'rainy', 4, 5, 'عمل جزئي بسبب الأمطار. تركيب أبواب داخلية.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '40a713b5-942a-4645-b0c0-6eb0ef02eb49', '2026-05-12', 'sunny', 6, 8, 'نجارة المطبخ وتركيب الخزائن.'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '919aff01-5e3e-4e21-b765-cd1064d0a6de', '2026-05-14', 'sunny', 5, 8, 'بدء أعمال الأساس للمشروع الجديد.');

-- ═══════════════════════════════════════════════════════════════
-- 5. CHANGE ORDERS (con_change_orders)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO con_change_orders (company_id, project_id, title, description, amount_change, status, approved_by, approved_at) VALUES
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', 'توسيع غرفة المعيشة', 'طلب العميل توسيع غرفة المعيشة بمقدار 3 متر مربع', 12500, 'approved', 'أحمد السيد', '2026-04-28'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', 'إضافة نافذة إضافية', 'إضافة نافذة في المطبخ لتحسين الإضاءة', 3200, 'approved', 'أحمد السيد', '2026-05-01'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '5519719f-bd4f-4c58-aa07-30733348ac89', 'تغيير نوع البلاط', 'تغيير بلاط الأرضيات من سيراميك إلى بورسلين فاخر', 8500, 'pending', NULL, NULL),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', 'إضافة تكييف مركزي', 'تركيب نظام تكييف مركزي بدل الوحدات المنفصلة', 28000, 'approved', 'م. خالد علي', '2026-04-18'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'ca822f20-5416-42d1-87a1-2300db7cb0c8', 'تعديل واجهة المبنى', 'تغيير تصميم الواجهة الخارجية حسب طلب العميل', 15500, 'rejected', 'أحمد السيد', '2026-05-16'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'a1ddd8c1-1552-44a9-bd00-b406e52660e1', 'زيادة ارتفاع السقف', 'رفع ارتفاع السقف من 3 إلى 3.5 متر', 22000, 'pending', NULL, NULL),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', 'dccf81e9-eef0-481b-b922-f793fa07fae5', 'إضافة غرفة غسيل', 'تحويل جزء من المخزن إلى غرفة غسيل', 7500, 'approved', 'م. خالد علي', '2026-05-07'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '40a713b5-942a-4645-b0c0-6eb0ef02eb49', 'تغيير ماركة المطبخ', 'استبدال مطبخ الماركة المحلية بمطبخ إيطالي', 18500, 'pending', NULL, NULL),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '919aff01-5e3e-4e21-b765-cd1064d0a6de', 'إضافة مدخل سيارة', 'إنشاء مدخل إضافي للسيارة بعرض 4 متر', 9500, 'pending', NULL, NULL),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '577f8168-693d-40cc-a505-9b756a097323', 'تغيير لون الدهان', 'تغيير ألوان الدهان الداخلي حسب طلب العميل', 1800, 'approved', 'أحمد السيد', '2026-04-30'),
('9cbe0947-2335-4254-8dfa-58d15381fbe2', '10a5ef38-30dd-4302-acf9-0a0f795ed99d', 'إضافة جاكوزي', 'تركيب جاكوزي في الحمام الرئيسي', 12500, 'rejected', 'أحمد السيد', '2026-04-22');
