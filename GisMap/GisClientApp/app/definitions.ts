///// <reference path="../scripts/typings/jquery/jquery.d.ts" />

module Gis {
    export interface IMapConfig {
        projection: string;
        center: [number, number];
        extent: [number, number, number, number];
        zoom: number;
        minZoom: number;
        maxZoom: number;
        basemap: string;
        basemapConfig: any;
    }
    
    export interface ICategory {
        id: number;
        code: string;
        name: string;
        layers: ILayer[];
    }

    export interface ILayer {
        id: number;
        name: string;
        description: string;
        category: string;
        url: string;
        featureType: string;
        projection: string;
        color: string;
        opacity?: number;
        fileName: string;
        asset: string;
        auth?: string;
        styleType?: string;
        styleKeyColumn?: string;

        visible: boolean;
        //internalLayer: ol.layer.Vector;
        internalLayer: ol.layer.Base;
        infoColumns?: IFeatureInfo[];
        infoGeometry?: IFeatureInfo[];
        gridDefaultColumns?: Array<any>;
        targetNamespace?: string;
        targetPrefix?: string;
        typeName?: string;

        search?: ISearchOnLayer;
        cqlFilter?: ICQLFilter;
        menuLayerItems?: Array<IMenuLayerItem>;
        menuFeatureItems?: Array<IMenuFeatureItem>;

        style?: ILStyles;
        reports?:  Array<ILayerReportSettings>;

        sourceType?: string;
        defaultIndex?: number;
        manualRefresh?: boolean;
    }

    export interface ILStyles {
        default: ol.style.Style[];
        list: Array<{ key: string, style: ol.style.Style[], styleOnSelect: ol.style.Style[] | null }>;
        settings: Array<any>;
    }

    export interface ISearchSettings {
        type: string; //Gis.searchType
        layer?: ILayer;
        feature?: ol.Feature;
        geometry?: any;
        bufferDistance?: string;
    }

    export interface ISearchOnLayer {
        layer?: ILayer;
        conditions: Array<ISearchCondition>;
        newSrcProperty?: string;
        newSrcPropItems?: Array<string>;
        //features?: Array<ol.Feature>;
    }

    export interface ISearchCondition {
        propertyName: string;
        condition: IItemNT; //searchCondition
        searchText: string;
    }

    export enum ESearchCondition {
        contain = "contain",
        notContain = "notContain",
        same = "same",
        notTheSame = "notTheSame"
    }

    export var searchConditions: Array<IItemNT> = [
        { name: ESearchCondition.contain, text: "contine" },
        { name: ESearchCondition.notContain, text: "nu contine" },
        { name: ESearchCondition.same, text: "exact" },
        { name: ESearchCondition.notTheSame, text: "diferit" }
    ]
    
    export interface IFeatureInfo {
        name: string;
        type: string;
        control?: string;
        value?: any;
        edit?: string;
        save?: string;
    }

    export interface ISelectedFeatures {
        layer: ol.layer.Vector;
        features: ol.Collection<ol.Feature>;
    }

    export interface ISelectFeatureConnected  {
        layer: ol.layer.Vector;
        feature: ol.Feature;
        connectedConstructii: Array<ISelectedFeatures>;
        connectedVegetatie: Array<ISelectedFeatures>;
    }

    export var featureId =  "_id_";

    export var featureType = {
        point: "point",
        line: "line",
        poly: "poly",
        tile: "tile",
        heatmap: "heatmap",
        icon: "icon",
        image: "image",
        cluster: "cluster",
        pointText: "pointText",
        polyReport: "polyReport"
    }

    export const featureTypeAddEdit = {
        point: 'Point',
        line: 'LineString',
        polygon: 'Polygon',
        icon: 'Icon'
    }

    export function featureTypeForVector(featureType: string):boolean {
        return (featureType === Gis.featureType.point
            || featureType === Gis.featureType.line
            || featureType === Gis.featureType.poly
            || featureType === Gis.featureType.icon
            || featureType === Gis.featureType.heatmap
            || featureType === Gis.featureType.cluster
            || featureType === Gis.featureType.pointText
            || featureType === Gis.featureType.polyReport
        )
    }

    export interface IItemNT {
        name: string;
        text: string;
    }

    export var layerTypeName: Array<IItemNT> = [
        { name: Gis.featureType.point, text: "Puncte" },
        { name: Gis.featureType.line, text: "Retele" },
        { name: Gis.featureType.poly, text: "Zone" },
        { name: Gis.featureType.icon, text: "Puncte imagine" },
        { name: Gis.featureType.heatmap, text: "Heatmap" },
        { name: Gis.featureType.cluster, text: "Cluster" },
        { name: Gis.featureType.tile, text: "Raster" },
        { name: Gis.featureType.image, text: "Imagine" },
        { name: Gis.featureType.pointText, text: "Puncte cu descriere" },
        { name: Gis.featureType.polyReport, text: "Zone raport cu strat conex"}
    ]

    export const styleTypeName: Array<IItemNT> = [
        { name: Gis.featureType.point, text: "Puncte" },
        { name: Gis.featureType.line, text: "Retele" },
        { name: Gis.featureType.poly, text: "Zone" },
        { name: Gis.featureType.icon, text: "Puncte imagine" },
        { name: Gis.featureType.pointText, text: "Puncte cu descriere" },
        { name: Gis.featureType.polyReport, text: "Zone raport cu strat conex" }
    ]

    //tipuri de geometrii asimilate coloanelor din gis server
    export var featureGeometryTypes = [
        "gml:Geometry",
        "gml:Point",
        "gml:MultiPoint",
        "gml:LineString",
        "gml:MultiLineString",
        "gml:Polygon",
        "gml:MultiPolygon",
    ];

    export var searchType = {
        multilayer: "multilayer",
        layerfeature: "layerfeature"
    }
    export var editFeatureInfo = {
        hide: "hide",
        read: "read",
        write: "write"
    }
    export var editFeaturePictureLink = {
        true: "true",
        false: "false"
    }

    export interface IGridDefaults {
        name: string;
        columns: Array<any>;
    }

    export interface IItem {
        id: number;
        text: string;
    }

    export interface IStatus {
        success: boolean;
        message: string;
    }

    export interface IAccessResursa {
        id: number;
        nume: string;
        descriere: string;
        type: string;
        access: boolean;
        defaultAccess?: boolean;
        optiuni?: Array<any>
    }

    export interface IOptiune {
        id: number;
        nume: string;
        idItem: number;
        descriere?: string;
        defaultAccess?: boolean;
        customAccess?: string;
        group?: string;
    }

    export interface IOptiuneRes extends IOptiune{
        access?: boolean;
        idResursa?: number;
    }

    export interface IOptiuneRol extends IOptiune {
        access?: boolean;
        overrideDefaults?: boolean;
        defaultOption?: IOptiune;
    }

    export interface IRoleOptiuni {
        id: number;
        nume: string;
        optiuni: Array<IOptiuneRol>
    }

    export interface ILayerStyleSettings {
        id: number;
        idResursa: number;
        styleKey: string;
        styleName: string;
        descriere: string;
        layerType: string;
        icon: string;
        style: any;
        styleOnSelect: any;
    }

    export interface ILayerReportSettings {
        id: number;
        idResReport: number;
        nume?: string;
        reportColumns: any;
        nameResData: string;
        dataColumns: any;
        constants: any;
        reportFormula: string;
        description: string;
        dataLayer?: ILayer;
        dataFeatures?: Array<{ reportFeature: ol.Feature, dataFeatures: Array<ol.Feature> }>;
        check?: boolean;
    }

    export interface IUserSettings {
        name: IItem;
        token?: string;
        idClient?: string;
        roles?: Array<IItem>;
        accessResurse?: Array<IAccessResursa>;
        categories?: Array<ICategory>;
        layers?: Array<ILayer>;
        mapConfig?: any;
        mapProjections?: Array<ISridProjection>;
        layersInfoConfig?: Array<any>;
        styles?: Array<ILayerStyleSettings>;
        reports?: Array<ILayerReportSettings>;
        client?: IClient;
    }

    export interface IMenuLayerItem {
        id: number;
        name: string;
        active: boolean;
        action: string;
        auth: string;
        data?: any;
    }

    export interface IMenuFeatureItem {
        id: number;
        name: string;
        active: boolean;
        action: string;
        auth: string;
        data?: any;
    }

    export var menuAction = {
        addStation: "addStation",
        addFeature: "addFeature",
        editFeature: "editFeature",
        addRoute: "addRoute",
        editRoute: "editRoute",
        refreshLayer: "refreshLayer",
        editLayer:"editLayer",
        regenerateRoutes: "regenerateRoutes",//
        generateRoute: "generateRoute",
        addTransportRoute: "addTransportRoute",
        editTransportRoute: "editTransportRoute"
        //infoLocatiiConexe: "infoLocatiiConexe"
    }
    export const authType = {
        route: 'route',
        layer: 'layer',
        object: 'object'
    }

    export const authAs = {
        auth_local_register: '/auth/local-register',
        auth_local_client_register: '/auth/local-client-register',
        auth_change_current_password: '/auth/change-current-password',
        auth_change_password: '/auth/change-password',
        auth_user_is_defined: '/auth/user-is-defined',
        data_save_current_user_info: '/data/save-current-user-info',
        data_save_user_roles: '/data/save-user-roles',
        data_layer : '/data/layer',
        data_add_layer: '/data/add-layer',
        data_update_layer: '/data/update-layer',
        data_save_resursa_optiuni: '/data/save-resursa-optiuni',
        data_save_resursa_roles_optiuni:'/data/save-resursa-roles-optiuni',
        data_save_resursa_roles: '/data/save-resursa-roles',
        data_resursa_roles: '/data/resursa-roles',
        data_add_resursa_interna: '/data/add-resursa-interna',
        data_update_resursa_interna: '/data/update-resursa-interna',
        data_add_role: '/data/add-role',
        data_update_role: '/data/update-role',
        data_all_layers: '/data/all-layers',
        data_add_client: '/data/add-client',
        data_edit_client: '/data/edit-client',
        data_add_internal_resource: '/data/add-optiuni-resurse-clienti',
        data_styles_descriptions: 'data/styles-descriptions',
        data_style_settings: '/data/style-settings',
        data_add_style_settings: '/data/add-style-settings',
        data_save_style_settings: '/data/save-style-settings',
        data_delete_style_settings: '/data/delete-style-settings',
        data_add_mapview_settings: '/data/add-mapview-settings',
        data_save_mapview_settings: '/data/save-mapview-settings',
        data_delete_mapview_settings: '/data/delete-mapview-settings',
        menu_admin: 'menu-admin',
        menu_visible: 'menu-visible',
        search_visible: 'search-visible',
        menu_category_hide_if_empty: 'menu-category-hide-if-empty',
        // menu_multi_feature_view_info: 'menu-multi-feature-view-info',
        menu_multi_feature_report: 'menu-multi-feature-report',
        menu_multi_feature_details: 'menu-multi-feature-details',
        info_multi_feature_hide: 'info-multi-feature-hide',
        info_single_feature_hide: 'info-single-feature-hide',
        devices_generate_devices_day_routes: '/devices/generate-devices-day-routes',
        devices_resume_devices_day_routes: '/devices/resume-devices-day-routes',
        devices_delete_devices_day_routes: '/devices/delete-devices-day-routes',
        devices_status_devices_day_routes: '/devices/status-devices-day-routes',
        devices_generate_adhoc_route: '/devices/generate-adhoc-route',
        data_save_user_info: '/data/save-user-info',
        data_user_info: '/data/user-info/',

        data_add_category: '/data/add-category',
        data_edit_category: '/data/edit-category',
        data_client_edit_category: '/data/client-edit-category'
       
    }

    export const authOpt = {
        read_route: "read-route",
        write_route: "write-route",
        view_control: "view-control",
        edit_control: "edit-control",
        read_object: "read-object",
        write_object: "write-object",
        read_layer: "read-layer",
        //
        view_layer_config: "view-layer-config",
        edit_layer_config: "edit-layer-config",
        add_layer_feature: "add-layer-feature",
        add_layer: "add-layer",
        refresh_layer: "refresh-layer",
        //
        
        in_add_feature: "in-add-feature",
        in_edit_feature: "in-edit-feature",
        in_info_feature: "in-info-feature",
        in_table_details: "in-table-details",
        in_table_report: "in-table-report",
        in_feature_is_picture: "in-feature-is-picture",
        //
        msg_layer_data: "msg-layer-data",
        in_msg_data: "in-msg-data",
        cql_layer_filter: "cql-layer-filter",
        cql_client_filter: "cql-client-filter",
        in_cql_client_filter: "in-cql-client-filter",
        //
        active_layer_at_init: "active-layer-at-init",
        in_hide_menu_category: "in-hide-menu-category",
        //
        message_selected_features_info: "message-selected-features-info",
        in_message_selected_features_info: "in-message-selected-features",
        //
        view_layer_feature_info: "view-layer-feature-info",
        edit_layer_feature_info: 'edit-layer-feature-info',
        edit_layer_feature_location: "edit-layer-feature-location",
        search_layer_feature_nearby: "search-layer-feature-nearby",
        report_layer_feature: "report-layer-feature",
        report_layer_feature_spatiuverde: "report-layer-feature-spatiuverde",
        report_spatiuverde_source_layer_constructii: "report-spatiuverde-source-layer-constructii",
        report_spatiuverde_source_layer_vegetatie: "report-spatiuverde-source-layer-vegetatie",
        //
        in_utc_to_local_convert: "in-utc-to-local-convert",
        //
        route_generare: "route-generare",
        route_points_layer: "route-points-layer",
        route_segments_layer: "route-segments-layer",
        //
        in_layer_menu_index : "in-layer-menu-index",
        //"": "",

        //
        play_layer_route: 'play-layer-route',
        //
        transport_route_generare: 'transport-route-generare',
        transport_route_edit: "transport-route-edit",
        //
        select_layer_feature: 'select-layer-feature',
        generate_report: 'generate-report',
        //
        connected_layer_activate_insert:'connected-layer-activate-insert',
        connected_layer_name: 'connected-layer-name',
        in_connected_layer_source: 'in-connected-layer-source',
        in_connected_layer_dest: 'in-connected-layer-dest',
        //
        input_rate_item: 'input-rate-item',
        input_rate_step: 'input-rate-step',
        input_rate_min: 'input-rate-min',
        input_rate_max: 'input-rate-max',
        //
        input_text_area: 'input-text-area',
        //
        info_connected_features: 'info-connected-features',
        in_info_connected_features: 'in-info-connected-features',
        
    }

    export const optionGroupType = {
        item: "item",
        layer: "layer",
        object: "object",
        index: "index",
        control: "control",
        relation: "relation"
    }

    export const authItemAccess = {
        true: 'true',
        false: 'false',
        YView: 'YView',
        NView: 'NView',
        YEdit: 'YEdit',
        NEdit: 'NEdit',
        YSave: 'YSave',
        NSave: 'NSave'
    }

    export const authItemDateTime = {
        dateTime: "Date-Time",
        date: "Date",
        time: "Time"
    }

    export const layerMenuItems:
        {
            refreshLayer: Gis.IMenuLayerItem,
            editLayer: Gis.IMenuLayerItem,
            addFeature: Gis.IMenuLayerItem,
            generateRoute: Gis.IMenuLayerItem,
            addTransportRoute: Gis.IMenuLayerItem,
            editTransportRoute: Gis.IMenuLayerItem,
            generateReport: Gis.IMenuLayerItem
        }
        =
        {
            refreshLayer: {
                id: 102,
                name: 'Refresh',
                active: true,
                action: Gis.menuAction.refreshLayer,
                auth: Gis.authOpt.refresh_layer,
                data: {}
            },
            editLayer: {
                id: 100,
                name: 'Modifica setari',
                active: true,
                action: Gis.menuAction.editLayer,
                auth: Gis.authOpt.edit_layer_config,
                data: {}
            },
            addFeature: {
                id: 101,
                name: 'Adauga locatie',
                active: true,
                action: Gis.menuAction.addFeature,
                auth: Gis.authOpt.add_layer_feature,
                data: {}
            },
            generateRoute: {
                id: 103,
                name: 'Creaza ruta',
                active: true,
                action: Gis.menuAction.generateRoute,
                auth: Gis.authOpt.route_generare,
                data: {}
            },
            addTransportRoute: {
                id: 104,
                name: 'Creaza ruta',
                active: true,
                action: Gis.menuAction.addTransportRoute,
                auth: Gis.authOpt.transport_route_generare,
                data: {}
            },
            editTransportRoute: {
                id: 105,
                name: 'Editeaza ruta',
                active: true,
                action: Gis.menuAction.editTransportRoute,
                auth: Gis.authOpt.transport_route_edit,
                data: {}
            },
            generateReport: {
                id: 106,
                name: 'Genereaza raport',
                active: true,
                action: Gis.menuAction.refreshLayer,
                auth: Gis.authOpt.generate_report,
                data: {}
            }
        }

    export const WFSTActionType = {
        insertFeature: 'insertFeature',
        updateInfo: 'updateInfo',
        updateLocation: 'updateLocation'
    }

    export const windowMessageType = {
        cqlFilter: "cqlFilter",
        featureExtraInfo: "featureExtraInfo",
        featureListExtraInfo: "featureListExtraInfo",
        sendMapClick: "sendMapClick",
        generateRoute: "generateRoute",
        animateRoute: "animateRoute",
        sendMapView: "sendMapView"
    }

    export const saveOptionType = {
        all: 'all',
        option: 'option'
    }

    export const styleType = {
       // color: "color",
        default: "default",
        //icon: "icon",
        multiStyle: "multiStyle",
        singleStyle: "singleStyle"
    }
    export const styleTypeList: Array<IItemNT> = [
        { name: styleType.default, text: "Stil de baza" },
        //{ name: styleType.color, text: "Culoare" },
        { name: styleType.multiStyle, text: "Stiluri multiple posibile" },
        { name: styleType.singleStyle, text: "Stil personalizat"}
    ]

    export const sourceType = {
        url: 'url',
        upload: 'upload'
    }

    export const sourceTypeList: Array<IItemNT> = [
        { name: sourceType.url, text: 'Url strat' },
        { name: sourceType.upload, text: 'Incarcare date din fisiere shapefiles' }
    ];

    export const destUploadAction = {
        create: 'CREATE',
        replace: 'REPLACE',
        append: 'APPEND'
    };
    //
    export const destUploadActionList: Array<IItemNT> = [
        { name: destUploadAction.create, text: 'Creaza resursa si date' },
        { name: destUploadAction.replace, text: 'Sterge tot si Inlocuieste datele' },
        { name: destUploadAction.append, text: 'Adauga la datele existente' }
    ];

    export interface IDayTaskState{
        id?: number;
        name?: string;
        type?: string;
        description?: string;
        status?: string;
        time?: string;
        routes?: number;
        points?: number;
    }

    
    export const formatDateTime = {
        dateTime: "DD/MM/YYYY HH:mm:ss",
        date: "DD/MM/YYYY",
        time: "HH:mm:ss",
    }

    export const RoutingType = {
        foot: "foot",
        car: "car"
    };
    //wayRoutingTypeList
    export const wayRoutingTypeList: Array<IItemNT> = [
        { name: RoutingType.foot, text: 'Mers pe jos' },
        { name: RoutingType.car, text: 'Mers cu masina' }
    ];

    export const LocationType = {
        point: "point",
        uuid_address: "uuid_address"
    };

    export const RouteType = {
        ad_hoc: "ad-hoc",
        transport: "transport"
    };

    export const wayRestrictType = {
        none: "none",
        trafic_greu: "trafic_greu"
    };

    export const wayRestrictTypeList: Array<IItemNT> = [
        { name: wayRestrictType.none, text: 'Fara restrictie' },
        { name: wayRestrictType.trafic_greu, text: 'Restrictie trafic greu' }
    ];
    export interface IRouteCoord {
        distance: number;
        coords: [number, number]
    };
    export interface IAnimate {
        layer: ILayer,
        feature: ol.Feature,
        styles: { route: ol.style.Style, start: ol.style.Style, finish: ol.style.Style, geoMarker: ol.style.Style[] },
        polyline: ol.geom.Geometry,
        route: ol.geom.Geometry,
        routeCoords: Array<IRouteCoord>,
        routeLength: number,
        routeFeature: ol.Feature,
        geoMarker: ol.Feature,
        vectorLayer: ol.layer.Vector,
        index: number,
        isAnimating: boolean,
        speed: number,
        maxSpeed: number,
        minSpeed: number,
        sliderValue: number,
        routeDist: Array<IRoutePointDist>,
        startPointIndex: number
    }

    export interface ISridProjection {
        proiectie: string;
        srid: string;
        proj4text: string
    }

    export interface IButtonTool {
        button: HTMLButtonElement;
        buttonCtrl: ol.control.Control;
        buttonStateOn: boolean;
    }
    export interface IMeasure {
        distance: IButtonTool;
        area: IButtonTool;
        layer: ol.layer.Vector;
        drawInteraction: ol.interaction.Draw;
        type: string;
        tooltipElement: HTMLElement;
        tooltipOverlay: ol.Overlay;
        onChangeListener: any;
    }
    export const ToolButtonType = {
        center: "center",
        select: "select",
        distance: "distance",
        area: "area"
    }
    export interface IRoutePointDist {
        idRoute: number,
        subrouteId: number,
        dist: number,
        distAgg: number,
        sfDist: number,
        sfDistAgg: number
    }
    export const MapClickMessageMode = {
        coordinates: "coordinates",
        properties: "properties",
        coordinates_propperties: "coordinates_properties",
    }
    export interface ILayerSourceLoading {
        layerId: number;
        timeout: number;
    }
}