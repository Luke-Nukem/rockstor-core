from nfsd_calls import (process_nfsd_calls, share_distribution,
                        share_client_distribution)

cb_map = {'nfs-distrib': 'process_nfsd_calls',
          'nfs-client-distrib': 'process_nfsd_calls',
          'nfs-share-distrib': 'share_distribution',
          'nfs-share-client-distrib': 'share_client_distribution',}
