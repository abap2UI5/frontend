CLASS z2ui5_cl_cds_01 DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC .

  PUBLIC SECTION.

    INTERFACES if_rap_query_provider.
  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.

CLASS z2ui5_cl_cds_01 IMPLEMENTATION.

  METHOD if_rap_query_provider~select.

    io_request->get_paging( ).

    DATA(lt_filter_cond) = io_request->get_filter( )->get_as_ranges( ).

    IF lt_filter_cond IS INITIAL.

      DATA(lv_resp) = z2ui5_cl_http_handler=>http_get( check_logging = abap_true ).

    ELSE.

      DATA(lv_body) = lt_filter_cond[ 1 ]-range[ 1 ]-low.
      lv_resp = z2ui5_cl_http_handler=>http_post( lv_body ).

    ENDIF.

    TYPES ty_T_data TYPE STANDARD TABLE OF z2ui5_cds_01 WITH EMPTY KEY.
    io_response->set_data( it_data = VALUE ty_T_data( ( data = lv_resp ) ) ).
    io_response->set_total_number_of_records( 1 ).
  ENDMETHOD.

ENDCLASS.
