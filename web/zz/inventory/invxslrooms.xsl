<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:template match="/">
<html>
<body>
    <table border="1" bgcolor="#F3F3F3" width="100%">
      <tr>
        <th><font size="2">#</font></th>
        <th><font onclick="sortInv('item')" color="#1D1D58">Item</font></th>
        <th><font size="1">Room</font></th>
       <th><font size="1">Vol.</font></th>
        <th><font size="2">Add / Deduct</font></th>
       <th><font onclick="sortInv('qty')" size="2"><font color="#1D1D58">Qty</font>.</font></th>
 
      </tr>
   <xsl:for-each select="xdoc/moving/inv[qty>0]">
   <xsl:sort  select="item" data-type="text" order="ascending" />

    <tr id="{position()-1}">
	<td width="5%"><font size="1"><xsl:number value="position()" format="1. " /></font></td>	
		<td width="35%"><font size="2" style="cursor:pointer;"><xsl:attribute name="onclick">alterQty(<xsl:value-of select="recnum" />,+1)</xsl:attribute><xsl:value-of select="item" /></font></td>
		<td width="10%" align="center">
			<xsl:choose>
				<xsl:when test="qty&gt;'0'">
					<font size="2" color="#006600" style="cursor:pointer;"><xsl:attribute name="onclick">assignRoom(<xsl:value-of select="recnum" />)</xsl:attribute>#&#160;<xsl:value-of select="roomnameid" /></font>
                </xsl:when>
                <xsl:otherwise>
                 &#160;
                </xsl:otherwise>
			</xsl:choose>
			</td>

		<td width="10%"><font size="1"><xsl:value-of select="volume" /></font></td>
		<td width="25%" align="center">
				<table border="0" width="100%" style="border-collapse: collapse">
					<tr>
							<td align="center" style="border-right-style: solid; border-right-width: 1px" bordercolor="#808080"><font size="2" color="#C90000" style="cursor:pointer;"><xsl:attribute name="onclick">alterQty(<xsl:value-of select="recnum" />,0)</xsl:attribute>X</font></td>
							<td align="center" style="border-left-style: solid; border-left-width: 1px; border-right-style: solid; border-right-width: 1px" bordercolor="#808080"><font size="2" color="#1D1D58" style="cursor:pointer;"><xsl:attribute name="onclick">alterQty(<xsl:value-of select="recnum" />,-1)</xsl:attribute>-1</font></td>
							<td align="center" style="border-left-style: solid; border-left-width: 1px; border-right-style: solid; border-right-width: 1px" bordercolor="#808080"><font size="2" color="#004800" style="cursor:pointer;"><xsl:attribute name="onclick">alterQty(<xsl:value-of select="recnum" />,+1)</xsl:attribute>+1</font></td>
							<td align="center" style="border-left-style: solid; border-left-width: 1px" bordercolor="#808080"><font size="2" color="#004800" style="cursor:pointer;"><xsl:attribute name="onclick">alterQty(<xsl:value-of select="recnum" />,+10)</xsl:attribute>+10</font></td>
					</tr>
				</table></td>
		<td width="10%" align="center"><xsl:value-of select="qty" /></td>
	</tr>
	</xsl:for-each>
    </table>


</body>
</html>
</xsl:template>
</xsl:stylesheet>