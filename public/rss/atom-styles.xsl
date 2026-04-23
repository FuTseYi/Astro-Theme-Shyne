<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template name="month-name">
    <xsl:param name="key"/>
    <xsl:choose>
      <xsl:when test="$key='01' or $key='Jan' or $key='JAN'">January</xsl:when>
      <xsl:when test="$key='02' or $key='Feb' or $key='FEB'">February</xsl:when>
      <xsl:when test="$key='03' or $key='Mar' or $key='MAR'">March</xsl:when>
      <xsl:when test="$key='04' or $key='Apr' or $key='APR'">April</xsl:when>
      <xsl:when test="$key='05' or $key='May' or $key='MAY'">May</xsl:when>
      <xsl:when test="$key='06' or $key='Jun' or $key='JUN'">June</xsl:when>
      <xsl:when test="$key='07' or $key='Jul' or $key='JUL'">July</xsl:when>
      <xsl:when test="$key='08' or $key='Aug' or $key='AUG'">August</xsl:when>
      <xsl:when test="$key='09' or $key='Sep' or $key='SEP'">September</xsl:when>
      <xsl:when test="$key='10' or $key='Oct' or $key='OCT'">October</xsl:when>
      <xsl:when test="$key='11' or $key='Nov' or $key='NOV'">November</xsl:when>
      <xsl:when test="$key='12' or $key='Dec' or $key='DEC'">December</xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="format-date">
    <xsl:param name="date"/>
    <xsl:variable name="raw" select="normalize-space($date)"/>

    <xsl:choose>
      <xsl:when test="string-length($raw)=0">
        <xsl:text>Unknown date</xsl:text>
      </xsl:when>

      <xsl:when test="substring($raw, 5, 1)='-' and substring($raw, 8, 1)='-'">
        <xsl:variable name="year" select="substring($raw, 1, 4)"/>
        <xsl:variable name="monthKey" select="substring($raw, 6, 2)"/>
        <xsl:variable name="day" select="number(substring($raw, 9, 2))"/>
        <xsl:variable name="monthName">
          <xsl:call-template name="month-name">
            <xsl:with-param name="key" select="$monthKey"/>
          </xsl:call-template>
        </xsl:variable>
        <xsl:choose>
          <xsl:when test="string-length(normalize-space($monthName)) &gt; 0 and string-length($year)=4">
            <xsl:value-of select="concat($monthName, ' ', $day, ', ', $year)"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="$raw"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>

      <xsl:otherwise>
        <xsl:variable name="rfc" select="normalize-space(concat(substring-after(concat($raw, ','), ','), ''))"/>
        <xsl:variable name="normalizedRfc">
          <xsl:choose>
            <xsl:when test="string-length($rfc) &gt; 0">
              <xsl:value-of select="$rfc"/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="$raw"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <xsl:variable name="day" select="number(substring($normalizedRfc, 1, 2))"/>
        <xsl:variable name="monthKey" select="substring($normalizedRfc, 4, 3)"/>
        <xsl:variable name="year" select="substring($normalizedRfc, 8, 4)"/>
        <xsl:variable name="monthName">
          <xsl:call-template name="month-name">
            <xsl:with-param name="key" select="$monthKey"/>
          </xsl:call-template>
        </xsl:variable>
        <xsl:choose>
          <xsl:when test="string-length(normalize-space($monthName)) &gt; 0 and string-length($year)=4">
            <xsl:value-of select="concat($monthName, ' ', $day, ', ', $year)"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="$raw"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="/atom:feed">
    <xsl:variable name="siteTitle">
      <xsl:choose>
        <xsl:when test="string-length(normalize-space(atom:title)) &gt; 0">
          <xsl:value-of select="normalize-space(atom:title)"/>
        </xsl:when>
        <xsl:otherwise>Untitled Site</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="siteDescription">
      <xsl:choose>
        <xsl:when test="string-length(normalize-space(atom:subtitle)) &gt; 0">
          <xsl:value-of select="normalize-space(atom:subtitle)"/>
        </xsl:when>
        <xsl:otherwise>No description available.</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="pageLang">
      <xsl:choose>
        <xsl:when test="string-length(normalize-space(/atom:feed/@xml:lang)) &gt; 0">
          <xsl:value-of select="normalize-space(/atom:feed/@xml:lang)"/>
        </xsl:when>
        <xsl:otherwise>en</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="siteLink">
      <xsl:choose>
        <xsl:when test="string-length(normalize-space(atom:link[@rel='alternate'][1]/@href)) &gt; 0">
          <xsl:value-of select="atom:link[@rel='alternate'][1]/@href"/>
        </xsl:when>
        <xsl:when test="string-length(normalize-space(atom:link[1]/@href)) &gt; 0">
          <xsl:value-of select="atom:link[1]/@href"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>/</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="iconHref">
      <xsl:choose>
        <xsl:when test="string-length(normalize-space(atom:icon)) &gt; 0">
          <xsl:value-of select="normalize-space(atom:icon)"/>
        </xsl:when>
        <xsl:when test="string-length(normalize-space(atom:logo)) &gt; 0">
          <xsl:value-of select="normalize-space(atom:logo)"/>
        </xsl:when>
        <xsl:otherwise></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="appleTouchIconHref">
      <xsl:choose>
        <xsl:when test="string-length(normalize-space(atom:logo)) &gt; 0">
          <xsl:value-of select="normalize-space(atom:logo)"/>
        </xsl:when>
        <xsl:when test="string-length(normalize-space(atom:icon)) &gt; 0">
          <xsl:value-of select="normalize-space(atom:icon)"/>
        </xsl:when>
        <xsl:otherwise></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <html lang="{$pageLang}">
      <head>
        <title>Atom Feed | <xsl:value-of select="$siteTitle"/></title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <xsl:if test="string-length(normalize-space($iconHref)) &gt; 0">
          <link rel="icon" href="{$iconHref}"/>
        </xsl:if>
        <xsl:if test="string-length(normalize-space($appleTouchIconHref)) &gt; 0">
          <link rel="apple-touch-icon" href="{$appleTouchIconHref}"/>
        </xsl:if>
        <link rel="preload" href="/fonts/GeistVF.woff2" as="font" type="font/woff2" crossorigin="anonymous"/>
        <link rel="preload" href="/fonts/GeistMonoVF.woff2" as="font" type="font/woff2" crossorigin="anonymous"/>
        <link rel="stylesheet" href="/rss/rss.css"/>
      </head>
      <body>
        <header>
          <h1><xsl:value-of select="$siteTitle"/></h1>
          <p class="subtitle"><xsl:value-of select="$siteDescription"/></p>
          <a href="{$siteLink}" class="button">
            <span>Visit site</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 17l10-10M13 7h4v4"/>
              <path d="M17 7v0"/>
            </svg>
          </a>
        </header>

        <main>
          <ul class="posts">
            <xsl:for-each select="atom:entry">
              <xsl:variable name="entryLink">
                <xsl:choose>
                  <xsl:when test="string-length(normalize-space(atom:link[@rel='alternate'][1]/@href)) &gt; 0">
                    <xsl:value-of select="atom:link[@rel='alternate'][1]/@href"/>
                  </xsl:when>
                  <xsl:when test="string-length(normalize-space(atom:link[1]/@href)) &gt; 0">
                    <xsl:value-of select="atom:link[1]/@href"/>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="$siteLink"/>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:variable>
              <li class="post">
                <a class="post-link" href="{$entryLink}">
                  <span class="title">
                    <xsl:choose>
                      <xsl:when test="string-length(normalize-space(atom:title)) &gt; 0">
                        <xsl:value-of select="atom:title"/>
                      </xsl:when>
                      <xsl:otherwise>Untitled Post</xsl:otherwise>
                    </xsl:choose>
                  </span>
                </a>
                <div class="meta">
                  <xsl:variable name="rawDate" select="atom:updated"/>
                  <time datetime="{$rawDate}">
                    <span class="badge">Updated</span>
                    <xsl:call-template name="format-date">
                      <xsl:with-param name="date" select="$rawDate"/>
                    </xsl:call-template>
                  </time>
                </div>
                <p class="summary">
                  <xsl:choose>
                    <xsl:when test="string-length(normalize-space(atom:summary)) &gt; 0">
                      <xsl:value-of select="atom:summary"/>
                    </xsl:when>
                    <xsl:when test="string-length(normalize-space(atom:content)) &gt; 0">
                      <xsl:value-of select="atom:content"/>
                    </xsl:when>
                    <xsl:otherwise>No summary available.</xsl:otherwise>
                  </xsl:choose>
                </p>
              </li>
            </xsl:for-each>
          </ul>
        </main>

        <div class="belonging">
          This is an Atom feed generated by
          <a href="{$siteLink}" target="_blank" rel="noopener noreferrer">
            <xsl:value-of select="$siteTitle"/>
          </a>.
          Feed readers can use the URL in the address bar.
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
