class ZCL_Z2UI5_ODATA_DPC_EXT definition
  public
  inheriting from ZCL_Z2UI5_ODATA_DPC
  create public .

public section.

  methods /IWBEP/IF_MGW_APPL_SRV_RUNTIME~GET_ENTITYSET
    redefinition.

protected section.
private section.
ENDCLASS.

CLASS ZCL_Z2UI5_ODATA_DPC_EXT IMPLEMENTATION.

  METHOD /iwbep/if_mgw_appl_srv_runtime~get_entityset.

    DATA(lt_filter_cond) = io_tech_request_context->get_filter( )->get_filter_select_options( ).
    DATA(lv_body) = VALUE #( lt_filter_cond[ 1 ]-select_options[ 1 ]-low OPTIONAL ).

    DATA(lv_resp) = COND #( WHEN lv_body IS INITIAL
        THEN z2ui5_cl_http_handler=>http_get( )
        ELSE z2ui5_cl_http_handler=>http_post( lv_body ) ).

    DATA lt_result TYPE zcl_z2ui5_odata_mpc=>tt_z2ui5_odata.
    lt_result = VALUE #( ( data = lv_resp ) ).
    copy_data_to_ref( EXPORTING is_data = lt_result CHANGING cr_data = er_entityset ).

  ENDMETHOD.

ENDCLASS.
