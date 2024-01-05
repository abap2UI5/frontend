class Z2UI5_CL_LAUNCHPAD_HANDLER definition
  public
  final
  create public .

public section.

  interfaces IF_HTTP_EXTENSION .
  PROTECTED SECTION.
  PRIVATE SECTION.
ENDCLASS.



CLASS Z2UI5_CL_LAUNCHPAD_HANDLER IMPLEMENTATION.


  METHOD IF_HTTP_EXTENSION~HANDLE_REQUEST.

    DATA(lv_resp) = SWITCH #( server->request->get_method( )
       WHEN 'GET'  THEN z2ui5_cl_fw_http_handler=>http_get( )
       WHEN 'POST' THEN z2ui5_cl_fw_http_handler=>http_post( server->request->get_cdata( ) ) ).

    server->response->set_header_field( name = `cache-control` value = `no-cache` ).
    server->response->set_cdata( lv_resp ).
    server->response->set_status( code = 200 reason = `success` ).

  ENDMETHOD.
ENDCLASS.
