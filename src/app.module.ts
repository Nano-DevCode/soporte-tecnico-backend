import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfiguration, JoiValidationSchema } from './config';
import { TicketsModule } from './tickets/tickets.module';
import { SchoolPeriodsModule } from './school-periods/school-periods.module';
import { TagsModule } from './tags/tags.module';
import { IssueTypeModule } from './issue_type/issue_type.module';
import { TicketHistoryModule } from './ticket-history/ticket-history.module';
import { ReportsModule } from './reports/reports.module';
import { DocumentsModule } from './documents/documents.module';
import { TypeDocumentsModule } from './type-documents/type-documents.module';
import { CatalogSeedModule } from './catalog-seed/catalog-seed.module';
import { EquipmentsModule } from './equipments/equipments.module';
import { BrandsModule } from './brands/brands.module';
import { ModelsModule } from './models/models.module';
import { PrintersModule } from './printers/printers.module';
import { PrinterfunctiontypesModule } from './printerfunctiontypes/printerfunctiontypes.module';
import { PrintingtypesModule } from './printingtypes/printingtypes.module';
import { ComputersModule } from './computers/computers.module';
import { StoragetypesModule } from './storagetypes/storagetypes.module';
import { ComputerequipmenttypesModule } from './computerequipmenttypes/computerequipmenttypes.module';
import { TypenetworksModule } from './typenetworks/typenetworks.module';
import { NetworksModule } from './networks/networks.module';
import { DepartmentsModule } from './departments/departments.module';
import { ResponsibleequipmentsModule } from './responsibleequipments/responsibleequipments.module';
import { EquipmentticketsModule } from './equipmenttickets/equipmenttickets.module';
import { BullModule } from '@nestjs/bull';
import { RolesModule } from './roles/roles.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { GmailBotModule } from './gmail-bot/gmail-bot.module';
import { GmailProcessorModule } from './gmail-processor/gmail-processor.module';
import { TelegramProcessorModule } from './telegram-processor/telegram-processor.module';
import { FilesModule } from './files/files.module';
import { RoleSeedModule } from './role-seed/role-seed.module';
import { AuthModule } from './auth/auth.module';
import { StaffModule } from './staff/staff.module';
import { UserSeedModule } from './user-seed/user-seed.module';
import { DepartamentSeedModule } from './departament-seed/departament-seed.module';
import { ResponsesModule } from './responses/responses.module';
import { MaintenanceTypeModule } from './maintenance-type/maintenance-type.module';
import { ServiceTypeModule } from './service-type/service-type.module';
import { PauseReportsModule } from './pause-reports/pause-reports.module';
import { RejectionReportsModule } from './rejection-reports/rejection-reports.module';
import { OperatingsystemsModule } from './operatingsystems/operatingsystems.module';
import { EquipmenttypesModule } from './equipmenttypes/equipmenttypes.module';
import { EquipmentSeedModule } from './equipment-seed/equipment-seed.module';
import { ResponsePdfsModule } from './response-pdfs/response-pdfs.module';
import { PrinterModule } from './printer/printer.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CoordinationsModule } from './coordinations/coordinations.module';
import { ComputerprocessorsModule } from './computerprocessors/computerprocessors.module';
import { PruebasocketsModule } from './pruebasockets/pruebasockets.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GeneralWebsocketModule } from './general-websocket/general-websocket.module';
import { AttendsModule } from './attends/attends.module';
import { ComputingCenterManagerModule } from './computing-center-manager/computing-center-manager.module';
import { CoordinationSeedModule } from './coordination-seed/coordination-seed.module';
import { TechnicalReportsModule } from './technical-reports/technical-reports.module';
import { FolioCountersModule } from './folio-counters/folio-counters.module';
import { ResponseSignatureModule } from './response-signature/response-signature.module';
import { ToolsModule } from './tools/tools.module';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { ExcelModule } from './excel/excel.module';
import { HealthModule } from './health/health.module';
import { ItAssetsModule } from './it-assets/it-assets.module';
import { ItAssetsBrandsModule } from './it-assets-brands/it-assets-brands.module';
import { ItAssetsModelsModule } from './it-assets-models/it-assets-models.module';
import { ItAssetsStatusModule } from './it-assets-status/it-assets-status.module';
import { ItAssetsTypesModule } from './it-assets-type/it-assets-types.module';
import { ItAssetsInvoicesModule } from './it-assets-invoices/it-assets-invoices.module';
import { ItAssetsMovementsModule } from './it-assets-movements/it-assets-movements.module';
import { ItAssetsMovementsOutModule } from './it-assets-movements-out/it-assets-movements-out.module';
import { ItAssetsMovementsInModule } from './it-assets-movements-in/it-assets-movements-in.module';
import { ConsumablesModule } from './consumables/consumables.module';
import { TypeconsumablesModule } from './typeconsumables/typeconsumables.module';
import { UnitMeasurementModule } from './unit-measurement/unit-measurement.module';
import { BatchesproductsModule } from './batchesproducts/batchesproducts.module';
import { ConsumableMovementsModule } from './consumable-movements/consumable-movements.module';
import { MovementAplicationsModule } from './movement_aplications/movement_aplications.module';
import { MovementTypesModule } from './movement_types/movement_types.module';
import { BrandConsumablesModule } from './brand-consumables/brand-consumables.module';
import { ConsumableUbicationsModule } from './consumable_ubications/consumable_ubications.module';
import path from 'path';
import { ConsumableSeedModule } from './consumable-seed/consumable-seed.module';
import { FaultValiditiesModule } from './fault-validities/fault-validities.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ToolsBrandsModule } from './tools-brands/tools-brands.module';
import { ToolsModelsModule } from './tools-models/tools-models.module';
import { ToolsInvoicesModule } from './tools-invoices/tools-invoices.module';
import { ToolsStatusModule } from './tools-status/tools-status.module';
import { ToolsTypesModule } from './tools-types/tools-types.module';
import { ToolsMovementsModule } from './tools-movements/tools-movements.module';
import { ToolsMovementsInModule } from './tools-movements-in/tools-movements-in.module';
import { ToolsMovementsOutModule } from './tools-movements-out/tools-movements-out.module';
import { SurveyModule } from './survey/survey.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { FeatureFlagsSeedModule } from './feature-flags-seed/feature-flags-seed.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [AppConfiguration],
      validationSchema: JoiValidationSchema,
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('db_host'),
        port: configService.get('db_port'),
        username: configService.get('db_username'),
        password: configService.get('db_password'),
        database: configService.get('db_name'),

        logging: ['error', 'warn'],
        maxQueryExecutionTime: 550,

        autoLoadEntities: true,
        synchronize: configService.get('db_synchronize') === 'true',
      }),
    }),

    // Configuracion Base de Redis
    // Solo configuramos la CONEXION aqui las colas se registran en sus propios modulos.
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('DB_HOST_REDIS'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Aqui va el modificador de lenguaje
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        {
          use: QueryResolver,
          options: ['lang'],
        },
        AcceptLanguageResolver,
      ],
    }),

    // Emision de eventos para websocket
    EventEmitterModule.forRoot({
      wildcard: true,
    }),

    ScheduleModule.forRoot(),

    // Modulos Alex
    TicketsModule,
    SchoolPeriodsModule,
    TagsModule,
    IssueTypeModule,
    TicketHistoryModule,
    ReportsModule,
    DocumentsModule,
    TypeDocumentsModule,
    PauseReportsModule,
    RejectionReportsModule,
    ResponsesModule,
    MaintenanceTypeModule,
    ServiceTypeModule,
    CatalogSeedModule,
    GeneralWebsocketModule,
    TechnicalReportsModule,
    FolioCountersModule,
    ResponseSignatureModule,
    PruebasocketsModule,
    AttendsModule,
    ComputingCenterManagerModule,
    // -------------
    BrandsModule,

    ModelsModule,
    EquipmentsModule,

    PrintingtypesModule,
    PrinterfunctiontypesModule,
    PrintersModule,

    ComputerequipmenttypesModule,
    StoragetypesModule,
    ComputersModule,

    TypenetworksModule,
    NetworksModule,
    DepartmentsModule,
    ResponsibleequipmentsModule,
    EquipmentticketsModule,

    //Manu Dependencias // Modulos del sistema
    DepartmentsModule,
    RolesModule,
    CommonModule,
    UsersModule,
    TelegramBotModule,
    GmailBotModule,
    GmailProcessorModule,
    TelegramProcessorModule,
    FilesModule,
    RoleSeedModule,
    AuthModule,
    StaffModule,
    UserSeedModule,
    DepartamentSeedModule,

    //// utlimo mio jaz
    OperatingsystemsModule,
    EquipmenttypesModule,
    ComputerequipmenttypesModule,
    EquipmentSeedModule,
    ResponsePdfsModule,
    PrinterModule,
    CoordinationsModule,
    ComputerprocessorsModule,

    CoordinationSeedModule,
    ToolsModule,
    CoordinationSeedModule,
    ToolsModule,
    ExcelModule,
    HealthModule,
    ItAssetsModule,
    ItAssetsBrandsModule,
    ItAssetsModelsModule,
    ItAssetsStatusModule,
    ItAssetsTypesModule,
    ItAssetsInvoicesModule,
    ItAssetsMovementsModule,
    ItAssetsMovementsOutModule,
    ItAssetsMovementsInModule,
    ConsumablesModule,
    TypeconsumablesModule,
    UnitMeasurementModule,
    BatchesproductsModule,
    ConsumableMovementsModule,
    MovementAplicationsModule,
    MovementTypesModule,
    BrandConsumablesModule,
    ConsumableUbicationsModule,
    ConsumableSeedModule,
    FaultValiditiesModule,
    DashboardModule,
    ToolsBrandsModule,
    ToolsModelsModule,
    ToolsInvoicesModule,
    ToolsStatusModule,
    ToolsTypesModule,
    ToolsMovementsModule,
    ToolsMovementsInModule,
    ToolsMovementsOutModule,
    SurveyModule,
    FeatureFlagsModule,
    FeatureFlagsSeedModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  constructor() {}
}
