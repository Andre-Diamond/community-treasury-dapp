// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({
    "tickerApiNames":{"ADA":"cardano",
      "GMBL":"",
      "AGIX":"singularitynet",
      "NTX":"nunet",
      "COPI":"cornucopias",
      "RJV":"rejuve-ai",
      "DJED":"djed",
      "SHEN":"shen",
      "WMT":"world-mobile-token"
    },
    "tickerFingerprints":{"ADA":"",
      "GMBL":"asset1seuf4pwhwdxqtrsz4axfwtrp94gkdlhcyat9nn",
      "AGIX":"asset1wwyy88f8u937hz7kunlkss7gu446p6ed5gdfp6",
      "NTX":"nunet",
      "COPI":"asset1c6uau7pufsxhnm7eg0eerhu4snwfd9sn7kvvvz",
      "RJV":"rejuve-ai",
      "DJED":"djed",
      "SHEN":"shen",
      "WMT":"world-mobile-token"
    },
    "tickerDecimals":{"ADA":6,
      "GMBL":6,
      "AGIX":8,
      "NTX":6,
      "COPI":6,
      "RJV":6,
      "DJED":6,
      "SHEN":6,
      "WMT":6,
    }
  })
}
