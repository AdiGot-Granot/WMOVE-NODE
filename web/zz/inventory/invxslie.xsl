<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:template match="/">
<html>
<body>
    <table border="2" bgcolor="#FFFF99" width="100%">
      <tr>
        <th><font size="2">#</font></th>
        <th><font size="2" color="000FF" onclick="sortXML('item')" style="cursor:hand"><u>item</u></font></th>
        <th><font size="1" style="cursor:hand">Volume</font></th>
        <th><font size="2" style="cursor:hand">Dec</font></th>
       <th><font size="2" style="cursor:hand">Qty.</font></th>
       <th><font size="2" style="cursor:hand">Add</font></th>
      </tr>
   <xsl:for-each select="xdoc/moving/inv[qty>0] ">
   <xsl:sort data-type="text" select="item" order="ascending" />

      <tr id="{position()-1}">
	<td width="5%">	
		<font size="2"><xsl:number value="position()" format="1. " /></font>
	</td>
	
	<td width="40%" style="font-size:11px; font-family: Arial; color: #0000FF">
		<xsl:text disable-output-escaping="yes">
		<![CDATA[<]]>font size="2" color="#0000FF" style="cursor:hand" onclick="alterQty('</xsl:text>
		<xsl:value-of select="recnum"/><xsl:text disable-output-escaping="yes">','add',1)"></xsl:text>
			<xsl:element name="{generate-id(qty)}">		
			<xsl:value-of select="item" />
		</xsl:element>
	</td>

	<td width="15%" style="font-size: 11px; font-family: Arial; color: #0000FF" align="right">
		<xsl:value-of select="volume" />
	</td>
        
	<td width="10%" align="center">
	   <xsl:choose>
		<xsl:when test="qty > 0">
		<xsl:text disable-output-escaping="yes">
		<![CDATA[<]]>font size="3" color="#FF0000" style="cursor:hand" onclick="zeroQty('</xsl:text>
		<xsl:value-of select="recnum"/><xsl:text disable-output-escaping="yes">')">x</xsl:text>
		</xsl:when>
	   </xsl:choose>
	   <xsl:choose>
		<xsl:when test="qty > 0">
		<xsl:text disable-output-escaping="yes">
		<![CDATA[<]]>font size="3" color="#0000FF" style="cursor:hand;font-weight: bold;" onclick="alterQty('</xsl:text>
		<xsl:value-of select="recnum"/><xsl:text disable-output-escaping="yes">','dec',1)"> -</xsl:text>
		</xsl:when>
		<xsl:otherwise>
			<font>.</font>
		</xsl:otherwise>
	   </xsl:choose>
	</td>

	<td width="10%" align="center">
	   <xsl:choose>
		<xsl:when test="qty > -1">
		<xsl:text disable-output-escaping="yes">
		<![CDATA[<]]>font size="4" color="#0000FF" style="cursor:hand" onclick="alterQty('</xsl:text>
		<xsl:value-of select="recnum"/><xsl:text disable-output-escaping="yes">','add',1)"></xsl:text>
		</xsl:when>
	   </xsl:choose>
	   <xsl:choose>
		<xsl:when test="qty > 0">
		<span style="color:#000000; font-size:12pt; font-weight: bold"><xsl:value-of select="qty" /></span>
		</xsl:when>
		<xsl:otherwise>
			<font style="cursor:hand">+</font>
		</xsl:otherwise>
	   </xsl:choose>
	</td>


	<td width="20%" align="center">
		<xsl:text disable-output-escaping="yes">
		<![CDATA[<]]>font size="2" color="#0000FF" style="cursor:hand" onclick="alterQty('</xsl:text>
		<xsl:value-of select="recnum"/><xsl:text disable-output-escaping="yes">','add',10)">  +10</xsl:text>
	</td>
	</tr>
	</xsl:for-each>
     
    </table>


</body>
</html>
</xsl:template>
</xsl:stylesheet>