@EndUserText.label: 'test'
@ObjectModel.query.implementedBy: 'ABAP:Z2UI5_CL_CDS_01'
@Search.searchable: true
define custom entity z2ui5_cds_01
{
  key uuid : abap.char(32);
      data : abap.string;
}
