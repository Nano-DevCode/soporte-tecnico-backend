import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1783967409213 implements MigrationInterface {
  name = 'InitialSchema1783967409213';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ae4578dcaed5adff96595e6166" ON "role" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "type_document" ("id" SERIAL NOT NULL, "name" text NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_83dcc7d899a6f4d496ac3f3fc52" UNIQUE ("name"), CONSTRAINT "PK_a89fb9f22e15824ce89c11c5a1b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" text NOT NULL, "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ticketId" uuid, "typeDocumentId" integer, CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ecdb65ee2441abbc8afc9111db" ON "document" ("ticketId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f31aaf44fd0441ab9aa0c289c6" ON "document" ("typeDocumentId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "issue_type" ("id" SERIAL NOT NULL, "name" text NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_4af451ab46a94e94394c72d911c" UNIQUE ("name"), CONSTRAINT "PK_cbaac4689773f8f434641a1b6b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "rejection_report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "justification" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ticketId" uuid NOT NULL, CONSTRAINT "PK_d2df18ec26540c7c53f0934038a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d2fa1dce5f29f8c3e87ddc4a5e" ON "rejection_report" ("ticketId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."school_period_period_type_enum" AS ENUM('enero-junio', 'verano', 'agosto-diciembre')`,
    );
    await queryRunner.query(
      `CREATE TABLE "school_period" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "period_type" "public"."school_period_period_type_enum" NOT NULL, "date_start" TIMESTAMP WITH TIME ZONE NOT NULL, "date_end" TIMESTAMP WITH TIME ZONE NOT NULL, "is_active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_cdde354a151ea53620d9ebf82b2" UNIQUE ("name"), CONSTRAINT "CHK_8662ac901f2aebec53c81a04b4" CHECK ("date_start" < "date_end"), CONSTRAINT "PK_05f7e93cd334679ac4b78717522" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ONLY_ONE_ACTIVE_PERIOD" ON "school_period" ("is_active") WHERE "is_active" = true`,
    );
    await queryRunner.query(
      `CREATE TABLE "tag" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"), CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "duration" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "statusId" integer NOT NULL, "ticketId" uuid NOT NULL, CONSTRAINT "PK_6d0f4bc32cc3581d6a016bca30a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e21ee24b378f44458738876372" ON "ticket_history" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dc5987a4a5dbe6cd4c77bc9ec1" ON "ticket_history" ("statusId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2bde375c7f9f2ffd77381df611" ON "ticket_history" ("ticketId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "status" ("id" SERIAL NOT NULL, "name" text NOT NULL, "code" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e77743a7955e652aa7ebf4a7650" UNIQUE ("code"), CONSTRAINT "PK_e12743a7086ec826733f54e1d95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "computing_center_manager" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "names" text NOT NULL, "first_last_name" text NOT NULL, "second_last_name" text NOT NULL, "is_active" boolean NOT NULL DEFAULT false, "rfc" character varying(13) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f24fd97e9f58aa34b7c043343ee" UNIQUE ("rfc"), CONSTRAINT "PK_c79eacad3b42adf1fcdd46902fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ONLY_ONE_ACTIVE_MANAGER" ON "computing_center_manager" ("is_active") WHERE "is_active" = true`,
    );
    await queryRunner.query(
      `CREATE TABLE "maintenance_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_6e5eb34ee2d74efad36e52ac4bb" UNIQUE ("name"), CONSTRAINT "PK_e51bdd8724eb1eb9c90a3bde646" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."response_signature_role_enum" AS ENUM('JEFE_CC', 'JEFE_DEPTO', 'PLANEACION')`,
    );
    await queryRunner.query(
      `CREATE TABLE "response_signature" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."response_signature_role_enum" NOT NULL, "signature_hash" text NOT NULL, "original_chain" text NOT NULL, "signed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "responseId" uuid, CONSTRAINT "PK_21a9fe41ef7010eb3505e5a7b4d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd2c5617199ef3cae905094805" ON "response_signature" ("responseId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_UNIQUE_SIGNATURE_PER_RESPONSE" ON "response_signature" ("responseId", "role") `,
    );
    await queryRunner.query(
      `CREATE TABLE "service_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8fa5bb7e266784b54f0de41d508" UNIQUE ("name"), CONSTRAINT "PK_0a11a8d444eff1346826caed987" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "response" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "diagnosis" text NOT NULL, "work_done" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ticketId" uuid, "computingCenterManagerId" uuid, "maintenanceTypeId" uuid, "serviceTypeId" uuid, CONSTRAINT "REL_905a2ad7451fa585a6db7fb593" UNIQUE ("ticketId"), CONSTRAINT "PK_f64544baf2b4dc48ba623ce768f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_246834e9accc3c9e888a43aaf9" ON "response" ("computingCenterManagerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_670ff49cfb629b36d86883cad9" ON "response" ("maintenanceTypeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b761dc51761a6bf9649a781058" ON "response" ("serviceTypeId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "pause_report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "diagnosis" text NOT NULL, "justification" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ticketId" uuid, CONSTRAINT "REL_a641507e11369f066062a73c7e" UNIQUE ("ticketId"), CONSTRAINT "PK_abb5e7a7bdb28b6237c056bea51" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "brand" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_5f468ae5696f07da025138e38f7" UNIQUE ("name"), CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "model" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_brand" uuid, CONSTRAINT "PK_d6df271bba301d5cc79462912a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "printerfunctiontype" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2a15fd0edf9407c382ec6834ca2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "printingtype" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c98a968ff402c0ca43bea09d1dc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "printer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "color" boolean NOT NULL DEFAULT false, "model_toner" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_equipment" uuid, "id_type_printing" uuid, "id_type_function" uuid, CONSTRAINT "REL_6c38feef17763d29cb674a29ed" UNIQUE ("id_equipment"), CONSTRAINT "PK_a07d4f7686a51f38ae237def52b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "computerequipmenttype" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cf6f3fbf7391178fca2a87762b2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "storagetype" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d2920c6160592f479d1a5d2291f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "operatingsystem" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3a0ddce17f70fee77913b8725d6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "computerprocessor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "brand" text NOT NULL, "model" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_460fa75b8cca3023faee7d65d61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "computer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ram" text NOT NULL, "capacity_storage" text NOT NULL, "available_storage" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_equipment" uuid, "id_type_equipment_computer" uuid, "id_type_storage" uuid, "id_type_operating_system" uuid, "id_processor" uuid, CONSTRAINT "REL_731c1102b77f8f41a055e0c46f" UNIQUE ("id_equipment"), CONSTRAINT "PK_775250089fb372f5edcfa2e5f95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "typenetwork" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0bbce0dff1a491257f84c712ebd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "network" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "number_ports" integer NOT NULL, "PoE" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_equipment" uuid, "id_type_equipment_network" uuid, CONSTRAINT "REL_463fa23d2bd8b473c397c03acc" UNIQUE ("id_equipment"), CONSTRAINT "PK_8f8264c2d37cbbd8282ee9a3c97" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "responsibleequipment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "num_employe" text NOT NULL, "name" text NOT NULL, "first_name" text NOT NULL, "last_name" text NOT NULL, "area" text NOT NULL, "mail" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_1938d9b7a76c0954d448d7cff6b" UNIQUE ("num_employe"), CONSTRAINT "UQ_273e707439c4fc7249babe29cc7" UNIQUE ("mail"), CONSTRAINT "PK_10e619854a4dd24bd238d7241f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "equipmenttype" ("id" SERIAL NOT NULL, "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_413ae66d346eaf822256f3eab25" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "brand_consumable" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_04b57667775e30c704f33f7545f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "consumable_ubication" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_91e1191e37ca071a110d7819d64" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "typeconsumable" ("id" SERIAL NOT NULL, "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e1bc7a9414a71dd50da853a8618" UNIQUE ("name"), CONSTRAINT "PK_58bf59abb6c88cbdf192a564fa0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "unit_measurement" ("id" SERIAL NOT NULL, "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_356c56a2d0eff4b5aebe508bc9a" UNIQUE ("name"), CONSTRAINT "PK_c9e8fdec3ffbb13248449c44a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "consumable" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "item_code" text NOT NULL, "name" text NOT NULL, "description" text NOT NULL, "number_uses" integer NOT NULL, "imageUrl" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_ubication_consumable" uuid, "id_brand_consumable" uuid, "id_type_consumable" integer, "id_unit_measurement" integer, CONSTRAINT "UQ_64a0641b73d5782628b806b53c7" UNIQUE ("item_code"), CONSTRAINT "UQ_302a6e0b6120f096b07f0b56250" UNIQUE ("description"), CONSTRAINT "PK_f7fc601187485536e1e47e909eb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "batchesproduct" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "num_requirement" text NOT NULL, "arrival_amount" integer NOT NULL, "quantity_consumable" integer NOT NULL, "available_stock" integer NOT NULL, "cost_batch" numeric(16,4) NOT NULL, "cost_unit" numeric(16,4) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_consumable" uuid, CONSTRAINT "PK_a3d719b08bd7922964d91881537" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_caee49421535feb75370f31dc0" ON "batchesproduct" ("id_consumable") `,
    );
    await queryRunner.query(
      `CREATE TABLE "movement_aplication" ("id" SERIAL NOT NULL, "name" text NOT NULL, "acronym" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_bdc9571757867cc2e8b5284781c" UNIQUE ("acronym"), CONSTRAINT "PK_908ed004616625d14eecca6097a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "movement_type" ("id" SERIAL NOT NULL, "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4b89a614f1d3ceba0c19f399ba1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "consumable_movement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code_movement_aplication" text NOT NULL, "quantity_consumable" integer NOT NULL, "observations" text NOT NULL, "movement_cost" numeric(16,4) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_batches_product" uuid, "id_movement_type" integer, "id_movement_aplication" integer, "id_ticket" uuid, "id_departament_consumable" uuid, CONSTRAINT "PK_5d5c761622214f5ecdf430873fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e078afae53bd2f02b9b87ff5fe" ON "consumable_movement" ("id_batches_product") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_458beb243eab9ea1916a02b8d3" ON "consumable_movement" ("id_movement_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8f8b1b79c2393c739553c0203e" ON "consumable_movement" ("id_movement_aplication") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54aa2ae05296c542205fa487a0" ON "consumable_movement" ("id_ticket") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_64ab6b2de3c5a03f8c351f27cb" ON "consumable_movement" ("id_departament_consumable") `,
    );
    await queryRunner.query(
      `CREATE TABLE "department" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "priority" numeric NOT NULL, "status" boolean NOT NULL DEFAULT true, "acronym" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_471da4b90e96c1ebe0af221e07b" UNIQUE ("name"), CONSTRAINT "UQ_bccb7571d677e4cc11093b2f3d7" UNIQUE ("acronym"), CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_471da4b90e96c1ebe0af221e07" ON "department" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bccb7571d677e4cc11093b2f3d" ON "department" ("acronym") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0dc397a4374b9ccd648cee43bb" ON "department" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb0dc10e89052aed29760055d1" ON "department" ("updated_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "equipment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "num_inventario" text NOT NULL, "status" boolean NOT NULL DEFAULT true, "description" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_model" uuid, "id_type_equipment" integer, "id_responsable" uuid, "id_departament" uuid, CONSTRAINT "UQ_1a78afc1682c21dcd80a38a024d" UNIQUE ("num_inventario"), CONSTRAINT "PK_0722e1b9d6eb19f5874c1678740" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd7e532bef3dc38054bc2ff71a" ON "equipment" ("id_model") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78f4d3e14d75aacccac44eafce" ON "equipment" ("id_type_equipment") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fff91fc6412042517fb4239aeb" ON "equipment" ("id_responsable") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f69a4eab2e681f2f900731df1" ON "equipment" ("id_departament") `,
    );
    await queryRunner.query(
      `CREATE TABLE "fault_validity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "penalizes_equipment" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_ebb70a6ff6ea623949081c14d94" UNIQUE ("name"), CONSTRAINT "PK_05462234933340c73ab92619e0a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'SoporteTecnicoDB',
        'public',
        'technical_report',
        'GENERATED_COLUMN',
        'textsearchable_index_col',
        "setweight(to_tsvector('spanish', unaccent_immutable(coalesce(work_performed, ''))), 'A') || setweight(to_tsvector('spanish', unaccent_immutable(coalesce(diagnosis, ''))), 'B')",
      ],
    );
    await queryRunner.query(
      `CREATE TABLE "technical_report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "diagnosis" text NOT NULL, "work_performed" text NOT NULL, "materials_used" text, "is_resolved" boolean NOT NULL, "textsearchable_index_col" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('spanish', unaccent_immutable(coalesce(work_performed, ''))), 'A') || setweight(to_tsvector('spanish', unaccent_immutable(coalesce(diagnosis, ''))), 'B')) STORED, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "faultValidityId" uuid, "ticketId" uuid, CONSTRAINT "PK_ed9e222bc40d14e5fefd8f2137e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_58eb5a4a410934f1342a369876" ON "technical_report" ("faultValidityId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b30bca3145e21d3b2f540065ff" ON "technical_report" ("ticketId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "it_assets_invoice" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idInternal" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7fc9e279e31690a763c164b88d3" UNIQUE ("idInternal"), CONSTRAINT "PK_32f8a6e927c80637997ef0c6b8a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "it_assets_brand" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_70ef64c4de1a1b0c1e8dc549281" UNIQUE ("name"), CONSTRAINT "PK_ffd82d66660d3e38a7b43c6e3e9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "it_assets_model" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "brandId" uuid NOT NULL, CONSTRAINT "PK_c680644b5f98ce0ccae4c8f9bbb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_44795e37cfee6673969e84a88b" ON "it_assets_model" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "it_assets_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c39c6e2911f801d434ff8a4d30a" UNIQUE ("name"), CONSTRAINT "PK_32bf7e7721882d55d5d34560a9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "it_asset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idInventary" text, "serialNumber" text, "status" boolean NOT NULL DEFAULT true, "inUse" boolean NOT NULL DEFAULT false, "description" text, "name" text, "imageUrl" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "modelId" uuid, "itAssetStatusId" uuid, "itAssetsTypeId" uuid, "invoiceId" uuid, CONSTRAINT "UQ_837e789739fa31e1b2d03fc310c" UNIQUE ("idInventary"), CONSTRAINT "UQ_fe468d67fab82dabdf24d53088b" UNIQUE ("serialNumber"), CONSTRAINT "PK_33cc241a1cd48406a2cd3d02883" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_837e789739fa31e1b2d03fc310" ON "it_asset" ("idInventary") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fe468d67fab82dabdf24d53088" ON "it_asset" ("serialNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_544d583c7744628da12d0c525a" ON "it_asset" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c05ebbd5f128db2099a5b250fe" ON "it_asset" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_508aa701e0683415aeaf07f43e" ON "it_asset" ("modelId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b2007dceff7cabdccc144026e" ON "it_asset" ("itAssetStatusId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b0e1e878a486b50111bcaba7f6" ON "it_asset" ("itAssetsTypeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f6e1b1db4d2ec49d9f07a6fc59" ON "it_asset" ("invoiceId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "it_assets_status" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text NOT NULL, CONSTRAINT "UQ_32ee75ee570a07389775256bf19" UNIQUE ("name"), CONSTRAINT "PK_bd7c3d260c836eb99ec02b253ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "it_assets_movements_in" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "observations" text, "movementId" uuid, "itAssetsStatusId" uuid, CONSTRAINT "REL_9c28cdd6b26770b8b7f2d24a69" UNIQUE ("movementId"), CONSTRAINT "PK_fd2f8dd828fbc49f5ba2ece96df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_68ceb219de97be4d547c2ecb7b" ON "it_assets_movements_in" ("itAssetsStatusId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."it_assets_movement_movement_type_enum" AS ENUM('IN', 'OUT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "it_assets_movement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "movement_type" "public"."it_assets_movement_movement_type_enum" NOT NULL, "itAssetId" uuid, CONSTRAINT "PK_ad48e86474f65a0cef1419bfe10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_35e64d4a8ecb31a3f62e429cd4" ON "it_assets_movement" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a49b238cf8dc264500ce1b480a" ON "it_assets_movement" ("itAssetId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "it_assets_movements_out" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "observations" text, "description" text, "voucher" text, "movementId" uuid, "itAssetsStatusId" uuid, "staffId" uuid, "ticket_id" uuid, CONSTRAINT "REL_1803e56295277b15532e586b34" UNIQUE ("movementId"), CONSTRAINT "PK_3e363118e98d708eb5164fd3ad7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_465b6a85e1323a5e5419bfc9f4" ON "it_assets_movements_out" ("itAssetsStatusId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23e45647164e055e89f9854642" ON "it_assets_movements_out" ("staffId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_218d722ef609b2e039aeb9714b" ON "it_assets_movements_out" ("ticket_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tools_invoice" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idInternal" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ae699533521461c5485a0096923" UNIQUE ("idInternal"), CONSTRAINT "PK_ef1101c9f029660f326cdf04bcf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tools_brand" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0c2c9e79713d77c1e2a3ffacd28" UNIQUE ("name"), CONSTRAINT "PK_81a64d7807ff50820d0345b149a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tools_model" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "brandId" uuid NOT NULL, CONSTRAINT "PK_d39c1a53c16d7c6fd3d5f6e0732" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8c340c772f1fbe9662df04bbc9" ON "tools_model" ("brandId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tools_type" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6e742184375b7338fd09119b02b" UNIQUE ("name"), CONSTRAINT "PK_6447164e578bb90163476016078" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tool" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idInventary" text, "status" boolean NOT NULL DEFAULT true, "inUse" boolean NOT NULL DEFAULT false, "description" text, "name" text, "imageUrl" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "modelId" uuid, "toolStatusId" uuid, "toolTypeId" uuid, "invoiceId" uuid, CONSTRAINT "UQ_d323d0a92d987de8a28e044c13c" UNIQUE ("idInventary"), CONSTRAINT "PK_3bf5b1016a384916073184f99b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d323d0a92d987de8a28e044c13" ON "tool" ("idInventary") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eee922a0180dbd82621832fa08" ON "tool" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_811e6102366c2d30bd9613617c" ON "tool" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_712b13d87c8d730cb065de74d6" ON "tool" ("modelId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd8136328129e5713cbf63a51d" ON "tool" ("toolStatusId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bad470f89b008dd6246d5accfa" ON "tool" ("toolTypeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c07632f0a3eed3e185c8b190e3" ON "tool" ("invoiceId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tools_status" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text NOT NULL, CONSTRAINT "UQ_00f2eb6c2d937e865dfdd2b35eb" UNIQUE ("name"), CONSTRAINT "PK_35394e7148244b645fab99aa07b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tools_movements_in" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "observations" text, "movementId" uuid, "toolsStatusId" uuid, CONSTRAINT "REL_4cdb753e5eb27063d2d4bd0424" UNIQUE ("movementId"), CONSTRAINT "PK_9fd64cd95722d47fc5725b46d5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9ce1b2e0ae2818dc6bda9e2695" ON "tools_movements_in" ("toolsStatusId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tools_movement_movement_type_enum" AS ENUM('IN', 'OUT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tools_movement" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "movement_type" "public"."tools_movement_movement_type_enum" NOT NULL, "toolId" uuid, CONSTRAINT "PK_4afa0b3d70c04927963fb40ee62" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f300922de26d97f0bf7e6e5996" ON "tools_movement" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6b60edb9adb7e223b096586ed" ON "tools_movement" ("toolId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tools_movements_out" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "observations" text, "description" text, "voucher" text, "movementId" uuid, "toolStatusId" uuid, "staffId" uuid, "ticket_id" uuid, CONSTRAINT "REL_4ab6c4ed9ecbc55a7bca15773e" UNIQUE ("movementId"), CONSTRAINT "PK_8305b109413a035d477c746f38a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dc1c7eab9b735ca8c1c7564722" ON "tools_movements_out" ("toolStatusId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de4980069c546101d595f8c35f" ON "tools_movements_out" ("staffId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c30f5204a149ca10db31699b8" ON "tools_movements_out" ("ticket_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "folio" text NOT NULL, "description" text NOT NULL, "affected_name" text NOT NULL, "evidence_url" text, "contact_email" text NOT NULL, "available_hours" text NOT NULL, "equipment_location" text NOT NULL, "priority" integer NOT NULL DEFAULT '0', "version" integer NOT NULL, "internal_folio" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "schoolPeriodId" uuid NOT NULL, "issueTypeId" integer NOT NULL, "jefeDeptoId" uuid NOT NULL, "coordinatorId" uuid, CONSTRAINT "UQ_276a911477d0d61f168b89aa704" UNIQUE ("folio"), CONSTRAINT "UQ_45548aab33353d5257b4aee2893" UNIQUE ("internal_folio"), CONSTRAINT "PK_d9a0835407701eb86f874474b7c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ba1b51f207cd4cd1456401267" ON "ticket" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4753f7ba66528ecab6fd3634a" ON "ticket" ("schoolPeriodId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_98e174471fd205fad2d60729da" ON "ticket" ("issueTypeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_94eaf173f7e7cdcb692c6f98d0" ON "ticket" ("jefeDeptoId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8dfea2ad89c81386a68726a9ab" ON "ticket" ("coordinatorId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attend" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "is_active" boolean NOT NULL DEFAULT true, "is_attending" boolean NOT NULL DEFAULT false, "assigned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ticketId" uuid, "technicianId" uuid, CONSTRAINT "PK_70f2de3432dd45b41e60d9b83d7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_180bed9a5bb8647c0349c70e9e" ON "attend" ("assigned_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b918bec1b28828e400a3677c88" ON "attend" ("ticketId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_960a363befea4f1d564881eea1" ON "attend" ("technicianId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_UNIQUE_ACTIVE_ATTEND" ON "attend" ("ticketId", "technicianId") WHERE "is_active" = true`,
    );
    await queryRunner.query(
      `CREATE TABLE "coordination" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6b68d44e3e17dc2523632417d7c" UNIQUE ("name"), CONSTRAINT "PK_9fff1681aa74370990a2d9dde69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b68d44e3e17dc2523632417d7" ON "coordination" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd6a7ca4edd4de4b2251ab86ba" ON "coordination" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "staff" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "idTelegram" text, "name" text NOT NULL, "paternalSurname" text NOT NULL, "maternalSurname" text NOT NULL, "num_control" text NOT NULL, "rfc" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "departmentId" uuid NOT NULL, "userId" uuid, "coordinationId" uuid, CONSTRAINT "UQ_82a23e9679267fa29e2d07d6f3b" UNIQUE ("idTelegram"), CONSTRAINT "UQ_c23f06aef98e2732032850a1e02" UNIQUE ("rfc"), CONSTRAINT "REL_eba76c23bcfc9dad2479b7fd2a" UNIQUE ("userId"), CONSTRAINT "PK_e4ee98bb552756c180aec1e854a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac1e6b1644e89c72ed1e16d2da" ON "staff" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_69064b1170aa06576eeff06fbe" ON "staff" ("paternalSurname") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b7bcd3b07f6a33442e9835628f" ON "staff" ("maternalSurname") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d7e1202ea47b2505c0d0deba0e" ON "staff" ("num_control") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78cf93ae22817c7d6ec5c27411" ON "staff" ("updated_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_67b6b543fe99f3accd85374f88" ON "staff" ("departmentId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb8b34927c9169d80a4a1867d8" ON "staff" ("coordinationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "password" text NOT NULL, "avatar" text, "status" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "roleId" uuid, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d091f1d36f18bbece2a9eabc6e" ON "user" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9cdce43fa0043c794281aa0905" ON "user" ("updated_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c28e52f758e7bbc53828db9219" ON "user" ("roleId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."survey_questions_type_enum" AS ENUM('RATING', 'TEXT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "survey_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "questionText" text NOT NULL, "type" "public"."survey_questions_type_enum" NOT NULL DEFAULT 'RATING', "isActive" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_131815624efb0f0e15a220102de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket_surveys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "answers" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "ticket_id" uuid, CONSTRAINT "REL_7724c54f5ad18c6850d9416c15" UNIQUE ("ticket_id"), CONSTRAINT "PK_2e61bb81b9754cc165badc790ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "report" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "diagnosis" text NOT NULL, "work_performed" text NOT NULL, "required_materials" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_99e4d0bea58cba73c57f935a546" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "folio_counters" ("id" character varying(100) NOT NULL, "current_value" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_7fe429a58d68e77597a540761e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "technical_report_equipments_equipment" ("technicalReportId" uuid NOT NULL, "equipmentId" uuid NOT NULL, CONSTRAINT "PK_6ad6212f89483f606b64d1fc611" PRIMARY KEY ("technicalReportId", "equipmentId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_75e7a0b23031475df2f1d6e76c" ON "technical_report_equipments_equipment" ("technicalReportId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f185937eb5a5a1bb7abc029f0a" ON "technical_report_equipments_equipment" ("equipmentId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ticket_tags_tag" ("ticketId" uuid NOT NULL, "tagId" integer NOT NULL, CONSTRAINT "PK_74f06374e396c0244b78dda63a2" PRIMARY KEY ("ticketId", "tagId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de02462cf143d7afb18b538450" ON "ticket_tags_tag" ("ticketId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a66ce4194f90cac843f309a804" ON "ticket_tags_tag" ("tagId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "document" ADD CONSTRAINT "FK_ecdb65ee2441abbc8afc9111dbb" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" ADD CONSTRAINT "FK_f31aaf44fd0441ab9aa0c289c6c" FOREIGN KEY ("typeDocumentId") REFERENCES "type_document"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rejection_report" ADD CONSTRAINT "FK_d2fa1dce5f29f8c3e87ddc4a5ec" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_history" ADD CONSTRAINT "FK_dc5987a4a5dbe6cd4c77bc9ec1f" FOREIGN KEY ("statusId") REFERENCES "status"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_history" ADD CONSTRAINT "FK_2bde375c7f9f2ffd77381df611b" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "response_signature" ADD CONSTRAINT "FK_fd2c5617199ef3cae9050948058" FOREIGN KEY ("responseId") REFERENCES "response"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" ADD CONSTRAINT "FK_905a2ad7451fa585a6db7fb5931" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" ADD CONSTRAINT "FK_246834e9accc3c9e888a43aaf96" FOREIGN KEY ("computingCenterManagerId") REFERENCES "computing_center_manager"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" ADD CONSTRAINT "FK_670ff49cfb629b36d86883cad97" FOREIGN KEY ("maintenanceTypeId") REFERENCES "maintenance_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" ADD CONSTRAINT "FK_b761dc51761a6bf9649a7810588" FOREIGN KEY ("serviceTypeId") REFERENCES "service_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pause_report" ADD CONSTRAINT "FK_a641507e11369f066062a73c7ef" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "model" ADD CONSTRAINT "FK_6a514583ae037284823c8cc6196" FOREIGN KEY ("id_brand") REFERENCES "brand"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "printer" ADD CONSTRAINT "FK_6c38feef17763d29cb674a29ed0" FOREIGN KEY ("id_equipment") REFERENCES "equipment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "printer" ADD CONSTRAINT "FK_4ea9f4dad916762a274b9556b48" FOREIGN KEY ("id_type_printing") REFERENCES "printingtype"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "printer" ADD CONSTRAINT "FK_de8768684ee66d2950284afa27d" FOREIGN KEY ("id_type_function") REFERENCES "printerfunctiontype"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" ADD CONSTRAINT "FK_731c1102b77f8f41a055e0c46ff" FOREIGN KEY ("id_equipment") REFERENCES "equipment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" ADD CONSTRAINT "FK_760a487e90fef8a241233a65570" FOREIGN KEY ("id_type_equipment_computer") REFERENCES "computerequipmenttype"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" ADD CONSTRAINT "FK_251fc9f4a0125a84503212def55" FOREIGN KEY ("id_type_storage") REFERENCES "storagetype"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" ADD CONSTRAINT "FK_0fa51aa02a47e470cae65211515" FOREIGN KEY ("id_type_operating_system") REFERENCES "operatingsystem"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" ADD CONSTRAINT "FK_bd816daa045315228d9571f9731" FOREIGN KEY ("id_processor") REFERENCES "computerprocessor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "network" ADD CONSTRAINT "FK_463fa23d2bd8b473c397c03acc6" FOREIGN KEY ("id_equipment") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "network" ADD CONSTRAINT "FK_81ff3ae08692a2528d946f70fb7" FOREIGN KEY ("id_type_equipment_network") REFERENCES "typenetwork"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable" ADD CONSTRAINT "FK_e33894a928df19e65d379a00571" FOREIGN KEY ("id_ubication_consumable") REFERENCES "consumable_ubication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable" ADD CONSTRAINT "FK_a28b35f49ca52af2accc234bd45" FOREIGN KEY ("id_brand_consumable") REFERENCES "brand_consumable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable" ADD CONSTRAINT "FK_8166ebd273f6bc6d0a22ec0fb31" FOREIGN KEY ("id_type_consumable") REFERENCES "typeconsumable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable" ADD CONSTRAINT "FK_6c50ee1925c6a9cbe6d91e3a45e" FOREIGN KEY ("id_unit_measurement") REFERENCES "unit_measurement"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "batchesproduct" ADD CONSTRAINT "FK_caee49421535feb75370f31dc03" FOREIGN KEY ("id_consumable") REFERENCES "consumable"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" ADD CONSTRAINT "FK_e078afae53bd2f02b9b87ff5feb" FOREIGN KEY ("id_batches_product") REFERENCES "batchesproduct"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" ADD CONSTRAINT "FK_458beb243eab9ea1916a02b8d3b" FOREIGN KEY ("id_movement_type") REFERENCES "movement_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" ADD CONSTRAINT "FK_8f8b1b79c2393c739553c0203ed" FOREIGN KEY ("id_movement_aplication") REFERENCES "movement_aplication"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" ADD CONSTRAINT "FK_54aa2ae05296c542205fa487a09" FOREIGN KEY ("id_ticket") REFERENCES "ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" ADD CONSTRAINT "FK_64ab6b2de3c5a03f8c351f27cbd" FOREIGN KEY ("id_departament_consumable") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "FK_fd7e532bef3dc38054bc2ff71aa" FOREIGN KEY ("id_model") REFERENCES "model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "FK_78f4d3e14d75aacccac44eafce7" FOREIGN KEY ("id_type_equipment") REFERENCES "equipmenttype"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "FK_fff91fc6412042517fb4239aeb1" FOREIGN KEY ("id_responsable") REFERENCES "responsibleequipment"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "FK_9f69a4eab2e681f2f900731df15" FOREIGN KEY ("id_departament") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report" ADD CONSTRAINT "FK_58eb5a4a410934f1342a3698767" FOREIGN KEY ("faultValidityId") REFERENCES "fault_validity"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report" ADD CONSTRAINT "FK_b30bca3145e21d3b2f540065ff7" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_model" ADD CONSTRAINT "FK_44795e37cfee6673969e84a88b1" FOREIGN KEY ("brandId") REFERENCES "it_assets_brand"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_asset" ADD CONSTRAINT "FK_508aa701e0683415aeaf07f43e1" FOREIGN KEY ("modelId") REFERENCES "it_assets_model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_asset" ADD CONSTRAINT "FK_6b2007dceff7cabdccc144026e1" FOREIGN KEY ("itAssetStatusId") REFERENCES "it_assets_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_asset" ADD CONSTRAINT "FK_b0e1e878a486b50111bcaba7f6b" FOREIGN KEY ("itAssetsTypeId") REFERENCES "it_assets_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_asset" ADD CONSTRAINT "FK_f6e1b1db4d2ec49d9f07a6fc594" FOREIGN KEY ("invoiceId") REFERENCES "it_assets_invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_in" ADD CONSTRAINT "FK_9c28cdd6b26770b8b7f2d24a696" FOREIGN KEY ("movementId") REFERENCES "it_assets_movement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_in" ADD CONSTRAINT "FK_68ceb219de97be4d547c2ecb7bd" FOREIGN KEY ("itAssetsStatusId") REFERENCES "it_assets_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movement" ADD CONSTRAINT "FK_a49b238cf8dc264500ce1b480a6" FOREIGN KEY ("itAssetId") REFERENCES "it_asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_out" ADD CONSTRAINT "FK_1803e56295277b15532e586b34d" FOREIGN KEY ("movementId") REFERENCES "it_assets_movement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_out" ADD CONSTRAINT "FK_465b6a85e1323a5e5419bfc9f4c" FOREIGN KEY ("itAssetsStatusId") REFERENCES "it_assets_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_out" ADD CONSTRAINT "FK_23e45647164e055e89f98546429" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_out" ADD CONSTRAINT "FK_218d722ef609b2e039aeb9714b4" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_model" ADD CONSTRAINT "FK_8c340c772f1fbe9662df04bbc9b" FOREIGN KEY ("brandId") REFERENCES "tools_brand"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tool" ADD CONSTRAINT "FK_712b13d87c8d730cb065de74d65" FOREIGN KEY ("modelId") REFERENCES "tools_model"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tool" ADD CONSTRAINT "FK_dd8136328129e5713cbf63a51d3" FOREIGN KEY ("toolStatusId") REFERENCES "tools_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tool" ADD CONSTRAINT "FK_bad470f89b008dd6246d5accfa9" FOREIGN KEY ("toolTypeId") REFERENCES "tools_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tool" ADD CONSTRAINT "FK_c07632f0a3eed3e185c8b190e3b" FOREIGN KEY ("invoiceId") REFERENCES "tools_invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_in" ADD CONSTRAINT "FK_4cdb753e5eb27063d2d4bd04242" FOREIGN KEY ("movementId") REFERENCES "tools_movement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_in" ADD CONSTRAINT "FK_9ce1b2e0ae2818dc6bda9e26954" FOREIGN KEY ("toolsStatusId") REFERENCES "tools_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movement" ADD CONSTRAINT "FK_c6b60edb9adb7e223b096586ed8" FOREIGN KEY ("toolId") REFERENCES "tool"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_out" ADD CONSTRAINT "FK_4ab6c4ed9ecbc55a7bca15773e4" FOREIGN KEY ("movementId") REFERENCES "tools_movement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_out" ADD CONSTRAINT "FK_dc1c7eab9b735ca8c1c75647224" FOREIGN KEY ("toolStatusId") REFERENCES "tools_status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_out" ADD CONSTRAINT "FK_de4980069c546101d595f8c35f4" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_out" ADD CONSTRAINT "FK_2c30f5204a149ca10db31699b83" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_b4753f7ba66528ecab6fd3634a2" FOREIGN KEY ("schoolPeriodId") REFERENCES "school_period"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_98e174471fd205fad2d60729da7" FOREIGN KEY ("issueTypeId") REFERENCES "issue_type"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_94eaf173f7e7cdcb692c6f98d05" FOREIGN KEY ("jefeDeptoId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" ADD CONSTRAINT "FK_8dfea2ad89c81386a68726a9abf" FOREIGN KEY ("coordinatorId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attend" ADD CONSTRAINT "FK_b918bec1b28828e400a3677c880" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attend" ADD CONSTRAINT "FK_960a363befea4f1d564881eea1d" FOREIGN KEY ("technicianId") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ADD CONSTRAINT "FK_67b6b543fe99f3accd85374f886" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ADD CONSTRAINT "FK_eba76c23bcfc9dad2479b7fd2ad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" ADD CONSTRAINT "FK_bb8b34927c9169d80a4a1867d82" FOREIGN KEY ("coordinationId") REFERENCES "coordination"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_c28e52f758e7bbc53828db92194" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_surveys" ADD CONSTRAINT "FK_7724c54f5ad18c6850d9416c15b" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report_equipments_equipment" ADD CONSTRAINT "FK_75e7a0b23031475df2f1d6e76c8" FOREIGN KEY ("technicalReportId") REFERENCES "technical_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report_equipments_equipment" ADD CONSTRAINT "FK_f185937eb5a5a1bb7abc029f0a5" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags_tag" ADD CONSTRAINT "FK_de02462cf143d7afb18b538450e" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags_tag" ADD CONSTRAINT "FK_a66ce4194f90cac843f309a8045" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ticket_tags_tag" DROP CONSTRAINT "FK_a66ce4194f90cac843f309a8045"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_tags_tag" DROP CONSTRAINT "FK_de02462cf143d7afb18b538450e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report_equipments_equipment" DROP CONSTRAINT "FK_f185937eb5a5a1bb7abc029f0a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report_equipments_equipment" DROP CONSTRAINT "FK_75e7a0b23031475df2f1d6e76c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_surveys" DROP CONSTRAINT "FK_7724c54f5ad18c6850d9416c15b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_c28e52f758e7bbc53828db92194"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" DROP CONSTRAINT "FK_bb8b34927c9169d80a4a1867d82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" DROP CONSTRAINT "FK_eba76c23bcfc9dad2479b7fd2ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "staff" DROP CONSTRAINT "FK_67b6b543fe99f3accd85374f886"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attend" DROP CONSTRAINT "FK_960a363befea4f1d564881eea1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attend" DROP CONSTRAINT "FK_b918bec1b28828e400a3677c880"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_8dfea2ad89c81386a68726a9abf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_94eaf173f7e7cdcb692c6f98d05"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_98e174471fd205fad2d60729da7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket" DROP CONSTRAINT "FK_b4753f7ba66528ecab6fd3634a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_out" DROP CONSTRAINT "FK_2c30f5204a149ca10db31699b83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_out" DROP CONSTRAINT "FK_de4980069c546101d595f8c35f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_out" DROP CONSTRAINT "FK_dc1c7eab9b735ca8c1c75647224"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_out" DROP CONSTRAINT "FK_4ab6c4ed9ecbc55a7bca15773e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movement" DROP CONSTRAINT "FK_c6b60edb9adb7e223b096586ed8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_in" DROP CONSTRAINT "FK_9ce1b2e0ae2818dc6bda9e26954"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_movements_in" DROP CONSTRAINT "FK_4cdb753e5eb27063d2d4bd04242"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tool" DROP CONSTRAINT "FK_c07632f0a3eed3e185c8b190e3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tool" DROP CONSTRAINT "FK_bad470f89b008dd6246d5accfa9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tool" DROP CONSTRAINT "FK_dd8136328129e5713cbf63a51d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tool" DROP CONSTRAINT "FK_712b13d87c8d730cb065de74d65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tools_model" DROP CONSTRAINT "FK_8c340c772f1fbe9662df04bbc9b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_out" DROP CONSTRAINT "FK_218d722ef609b2e039aeb9714b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_out" DROP CONSTRAINT "FK_23e45647164e055e89f98546429"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_out" DROP CONSTRAINT "FK_465b6a85e1323a5e5419bfc9f4c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_out" DROP CONSTRAINT "FK_1803e56295277b15532e586b34d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movement" DROP CONSTRAINT "FK_a49b238cf8dc264500ce1b480a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_in" DROP CONSTRAINT "FK_68ceb219de97be4d547c2ecb7bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_movements_in" DROP CONSTRAINT "FK_9c28cdd6b26770b8b7f2d24a696"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_asset" DROP CONSTRAINT "FK_f6e1b1db4d2ec49d9f07a6fc594"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_asset" DROP CONSTRAINT "FK_b0e1e878a486b50111bcaba7f6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_asset" DROP CONSTRAINT "FK_6b2007dceff7cabdccc144026e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_asset" DROP CONSTRAINT "FK_508aa701e0683415aeaf07f43e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "it_assets_model" DROP CONSTRAINT "FK_44795e37cfee6673969e84a88b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report" DROP CONSTRAINT "FK_b30bca3145e21d3b2f540065ff7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "technical_report" DROP CONSTRAINT "FK_58eb5a4a410934f1342a3698767"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "FK_9f69a4eab2e681f2f900731df15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "FK_fff91fc6412042517fb4239aeb1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "FK_78f4d3e14d75aacccac44eafce7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "FK_fd7e532bef3dc38054bc2ff71aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" DROP CONSTRAINT "FK_64ab6b2de3c5a03f8c351f27cbd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" DROP CONSTRAINT "FK_54aa2ae05296c542205fa487a09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" DROP CONSTRAINT "FK_8f8b1b79c2393c739553c0203ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" DROP CONSTRAINT "FK_458beb243eab9ea1916a02b8d3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable_movement" DROP CONSTRAINT "FK_e078afae53bd2f02b9b87ff5feb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "batchesproduct" DROP CONSTRAINT "FK_caee49421535feb75370f31dc03"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable" DROP CONSTRAINT "FK_6c50ee1925c6a9cbe6d91e3a45e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable" DROP CONSTRAINT "FK_8166ebd273f6bc6d0a22ec0fb31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable" DROP CONSTRAINT "FK_a28b35f49ca52af2accc234bd45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consumable" DROP CONSTRAINT "FK_e33894a928df19e65d379a00571"`,
    );
    await queryRunner.query(
      `ALTER TABLE "network" DROP CONSTRAINT "FK_81ff3ae08692a2528d946f70fb7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "network" DROP CONSTRAINT "FK_463fa23d2bd8b473c397c03acc6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" DROP CONSTRAINT "FK_bd816daa045315228d9571f9731"`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" DROP CONSTRAINT "FK_0fa51aa02a47e470cae65211515"`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" DROP CONSTRAINT "FK_251fc9f4a0125a84503212def55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" DROP CONSTRAINT "FK_760a487e90fef8a241233a65570"`,
    );
    await queryRunner.query(
      `ALTER TABLE "computer" DROP CONSTRAINT "FK_731c1102b77f8f41a055e0c46ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "printer" DROP CONSTRAINT "FK_de8768684ee66d2950284afa27d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "printer" DROP CONSTRAINT "FK_4ea9f4dad916762a274b9556b48"`,
    );
    await queryRunner.query(
      `ALTER TABLE "printer" DROP CONSTRAINT "FK_6c38feef17763d29cb674a29ed0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "model" DROP CONSTRAINT "FK_6a514583ae037284823c8cc6196"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pause_report" DROP CONSTRAINT "FK_a641507e11369f066062a73c7ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" DROP CONSTRAINT "FK_b761dc51761a6bf9649a7810588"`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" DROP CONSTRAINT "FK_670ff49cfb629b36d86883cad97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" DROP CONSTRAINT "FK_246834e9accc3c9e888a43aaf96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "response" DROP CONSTRAINT "FK_905a2ad7451fa585a6db7fb5931"`,
    );
    await queryRunner.query(
      `ALTER TABLE "response_signature" DROP CONSTRAINT "FK_fd2c5617199ef3cae9050948058"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_history" DROP CONSTRAINT "FK_2bde375c7f9f2ffd77381df611b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_history" DROP CONSTRAINT "FK_dc5987a4a5dbe6cd4c77bc9ec1f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rejection_report" DROP CONSTRAINT "FK_d2fa1dce5f29f8c3e87ddc4a5ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_f31aaf44fd0441ab9aa0c289c6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_ecdb65ee2441abbc8afc9111dbb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a66ce4194f90cac843f309a804"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_de02462cf143d7afb18b538450"`,
    );
    await queryRunner.query(`DROP TABLE "ticket_tags_tag"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f185937eb5a5a1bb7abc029f0a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_75e7a0b23031475df2f1d6e76c"`,
    );
    await queryRunner.query(
      `DROP TABLE "technical_report_equipments_equipment"`,
    );
    await queryRunner.query(`DROP TABLE "folio_counters"`);
    await queryRunner.query(`DROP TABLE "report"`);
    await queryRunner.query(`DROP TABLE "ticket_surveys"`);
    await queryRunner.query(`DROP TABLE "survey_questions"`);
    await queryRunner.query(`DROP TYPE "public"."survey_questions_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c28e52f758e7bbc53828db9219"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9cdce43fa0043c794281aa0905"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d091f1d36f18bbece2a9eabc6e"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bb8b34927c9169d80a4a1867d8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_67b6b543fe99f3accd85374f88"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78cf93ae22817c7d6ec5c27411"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d7e1202ea47b2505c0d0deba0e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b7bcd3b07f6a33442e9835628f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_69064b1170aa06576eeff06fbe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac1e6b1644e89c72ed1e16d2da"`,
    );
    await queryRunner.query(`DROP TABLE "staff"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd6a7ca4edd4de4b2251ab86ba"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b68d44e3e17dc2523632417d7"`,
    );
    await queryRunner.query(`DROP TABLE "coordination"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_UNIQUE_ACTIVE_ATTEND"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_960a363befea4f1d564881eea1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b918bec1b28828e400a3677c88"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_180bed9a5bb8647c0349c70e9e"`,
    );
    await queryRunner.query(`DROP TABLE "attend"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8dfea2ad89c81386a68726a9ab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_94eaf173f7e7cdcb692c6f98d0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_98e174471fd205fad2d60729da"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4753f7ba66528ecab6fd3634a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7ba1b51f207cd4cd1456401267"`,
    );
    await queryRunner.query(`DROP TABLE "ticket"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c30f5204a149ca10db31699b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_de4980069c546101d595f8c35f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dc1c7eab9b735ca8c1c7564722"`,
    );
    await queryRunner.query(`DROP TABLE "tools_movements_out"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c6b60edb9adb7e223b096586ed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f300922de26d97f0bf7e6e5996"`,
    );
    await queryRunner.query(`DROP TABLE "tools_movement"`);
    await queryRunner.query(
      `DROP TYPE "public"."tools_movement_movement_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9ce1b2e0ae2818dc6bda9e2695"`,
    );
    await queryRunner.query(`DROP TABLE "tools_movements_in"`);
    await queryRunner.query(`DROP TABLE "tools_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c07632f0a3eed3e185c8b190e3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bad470f89b008dd6246d5accfa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd8136328129e5713cbf63a51d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_712b13d87c8d730cb065de74d6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_811e6102366c2d30bd9613617c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eee922a0180dbd82621832fa08"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d323d0a92d987de8a28e044c13"`,
    );
    await queryRunner.query(`DROP TABLE "tool"`);
    await queryRunner.query(`DROP TABLE "tools_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c340c772f1fbe9662df04bbc9"`,
    );
    await queryRunner.query(`DROP TABLE "tools_model"`);
    await queryRunner.query(`DROP TABLE "tools_brand"`);
    await queryRunner.query(`DROP TABLE "tools_invoice"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_218d722ef609b2e039aeb9714b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23e45647164e055e89f9854642"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_465b6a85e1323a5e5419bfc9f4"`,
    );
    await queryRunner.query(`DROP TABLE "it_assets_movements_out"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a49b238cf8dc264500ce1b480a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_35e64d4a8ecb31a3f62e429cd4"`,
    );
    await queryRunner.query(`DROP TABLE "it_assets_movement"`);
    await queryRunner.query(
      `DROP TYPE "public"."it_assets_movement_movement_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_68ceb219de97be4d547c2ecb7b"`,
    );
    await queryRunner.query(`DROP TABLE "it_assets_movements_in"`);
    await queryRunner.query(`DROP TABLE "it_assets_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f6e1b1db4d2ec49d9f07a6fc59"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b0e1e878a486b50111bcaba7f6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b2007dceff7cabdccc144026e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_508aa701e0683415aeaf07f43e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c05ebbd5f128db2099a5b250fe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_544d583c7744628da12d0c525a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe468d67fab82dabdf24d53088"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_837e789739fa31e1b2d03fc310"`,
    );
    await queryRunner.query(`DROP TABLE "it_asset"`);
    await queryRunner.query(`DROP TABLE "it_assets_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_44795e37cfee6673969e84a88b"`,
    );
    await queryRunner.query(`DROP TABLE "it_assets_model"`);
    await queryRunner.query(`DROP TABLE "it_assets_brand"`);
    await queryRunner.query(`DROP TABLE "it_assets_invoice"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b30bca3145e21d3b2f540065ff"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58eb5a4a410934f1342a369876"`,
    );
    await queryRunner.query(`DROP TABLE "technical_report"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'textsearchable_index_col',
        'SoporteTecnicoDB',
        'public',
        'technical_report',
      ],
    );
    await queryRunner.query(`DROP TABLE "fault_validity"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f69a4eab2e681f2f900731df1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fff91fc6412042517fb4239aeb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78f4d3e14d75aacccac44eafce"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fd7e532bef3dc38054bc2ff71a"`,
    );
    await queryRunner.query(`DROP TABLE "equipment"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bb0dc10e89052aed29760055d1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0dc397a4374b9ccd648cee43bb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bccb7571d677e4cc11093b2f3d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_471da4b90e96c1ebe0af221e07"`,
    );
    await queryRunner.query(`DROP TABLE "department"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_64ab6b2de3c5a03f8c351f27cb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54aa2ae05296c542205fa487a0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8f8b1b79c2393c739553c0203e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_458beb243eab9ea1916a02b8d3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e078afae53bd2f02b9b87ff5fe"`,
    );
    await queryRunner.query(`DROP TABLE "consumable_movement"`);
    await queryRunner.query(`DROP TABLE "movement_type"`);
    await queryRunner.query(`DROP TABLE "movement_aplication"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_caee49421535feb75370f31dc0"`,
    );
    await queryRunner.query(`DROP TABLE "batchesproduct"`);
    await queryRunner.query(`DROP TABLE "consumable"`);
    await queryRunner.query(`DROP TABLE "unit_measurement"`);
    await queryRunner.query(`DROP TABLE "typeconsumable"`);
    await queryRunner.query(`DROP TABLE "consumable_ubication"`);
    await queryRunner.query(`DROP TABLE "brand_consumable"`);
    await queryRunner.query(`DROP TABLE "equipmenttype"`);
    await queryRunner.query(`DROP TABLE "responsibleequipment"`);
    await queryRunner.query(`DROP TABLE "network"`);
    await queryRunner.query(`DROP TABLE "typenetwork"`);
    await queryRunner.query(`DROP TABLE "computer"`);
    await queryRunner.query(`DROP TABLE "computerprocessor"`);
    await queryRunner.query(`DROP TABLE "operatingsystem"`);
    await queryRunner.query(`DROP TABLE "storagetype"`);
    await queryRunner.query(`DROP TABLE "computerequipmenttype"`);
    await queryRunner.query(`DROP TABLE "printer"`);
    await queryRunner.query(`DROP TABLE "printingtype"`);
    await queryRunner.query(`DROP TABLE "printerfunctiontype"`);
    await queryRunner.query(`DROP TABLE "model"`);
    await queryRunner.query(`DROP TABLE "brand"`);
    await queryRunner.query(`DROP TABLE "pause_report"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b761dc51761a6bf9649a781058"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_670ff49cfb629b36d86883cad9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_246834e9accc3c9e888a43aaf9"`,
    );
    await queryRunner.query(`DROP TABLE "response"`);
    await queryRunner.query(`DROP TABLE "service_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_UNIQUE_SIGNATURE_PER_RESPONSE"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fd2c5617199ef3cae905094805"`,
    );
    await queryRunner.query(`DROP TABLE "response_signature"`);
    await queryRunner.query(
      `DROP TYPE "public"."response_signature_role_enum"`,
    );
    await queryRunner.query(`DROP TABLE "maintenance_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ONLY_ONE_ACTIVE_MANAGER"`,
    );
    await queryRunner.query(`DROP TABLE "computing_center_manager"`);
    await queryRunner.query(`DROP TABLE "status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2bde375c7f9f2ffd77381df611"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dc5987a4a5dbe6cd4c77bc9ec1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e21ee24b378f44458738876372"`,
    );
    await queryRunner.query(`DROP TABLE "ticket_history"`);
    await queryRunner.query(`DROP TABLE "tag"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ONLY_ONE_ACTIVE_PERIOD"`);
    await queryRunner.query(`DROP TABLE "school_period"`);
    await queryRunner.query(
      `DROP TYPE "public"."school_period_period_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d2fa1dce5f29f8c3e87ddc4a5e"`,
    );
    await queryRunner.query(`DROP TABLE "rejection_report"`);
    await queryRunner.query(`DROP TABLE "issue_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f31aaf44fd0441ab9aa0c289c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ecdb65ee2441abbc8afc9111db"`,
    );
    await queryRunner.query(`DROP TABLE "document"`);
    await queryRunner.query(`DROP TABLE "type_document"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ae4578dcaed5adff96595e6166"`,
    );
    await queryRunner.query(`DROP TABLE "role"`);
  }
}
