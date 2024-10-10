import { ReactNode, useEffect, useMemo, useState } from 'react';

import Typography from '@mui/material/Typography';
import { checkout, config, passport, x } from '@imtbl/sdk';
import { Alert, Button, Card, CardActions, CardContent, CardMedia, Chip, Link, Modal, Stack } from '@mui/material';
import Box from '@mui/material/Box';

const baseURL = 'http://localhost:3010';
const collectionName = 'Simple sale';
const passportClientId = 'A83orcPcF1jADHTjf5pjDNljOUBQnNLp';


export const Sale = () => {
  const [saleWidget, setSaleWidget] = useState<checkout.Widget<typeof checkout.WidgetType.SALE> | null>(null);
  const [products, setProducts] = useState<{
    product_id: string;
    name: string;
    quantity: number;
    description: string;
    image: string;
    pricing: { amount: number; currency: string }[];
    collection: { collection_address: string; collection_type: string };
  }[]>([]);
  const [saleOpen, setSaleOpen] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'info' | 'warning' | 'error';
    message: ReactNode | string;
  } | null>(null);

  const urlParams = new URLSearchParams(window.location.search);
  const environment = config.Environment.SANDBOX;

  const environmentId = urlParams.get('environmentId') || '426e5b7a-84ff-45b5-a763-7ab0f41ceaaf';
  const login = urlParams.get('login') as string;

  const baseConfig = new config.ImmutableConfiguration({
    environment,
  });

  const passportConfig = {
    baseConfig,
    clientId: passportClientId,
    redirectUri: `${baseURL}/?login=true&environmentId=${environmentId}`,
    logoutRedirectUri: `${baseURL}/?logout=true&environmentId=${environmentId}`,
    audience: 'platform_api',
    scope: 'openid offline_access email transact',
  };

  const passportInstance = useMemo(
    () => new passport.Passport(passportConfig),
    [],
  );

  const checkoutInstance = useMemo(() => {
    return new checkout.Checkout({
      baseConfig,
      passport: passportInstance,
    });
  }, [passportInstance]);

  useEffect(() => {
    (async () => {
      const productsRequest = await fetch(`https://api.sandbox.immutable.com/v1/primary-sales/${environmentId}/products`);
      setProducts(await productsRequest.json());
    })();

  }, [environmentId]);

  useEffect(() => {
    (async () => {
      const widgets = await checkoutInstance.widgets({
        config: { theme: checkout.WidgetTheme.DARK },
      });

      setSaleWidget(widgets.create(checkout.WidgetType.SALE, {
        config: { theme: checkout.WidgetTheme.DARK, hideExcludedPaymentTypes: true },
      }));
    })();

  }, [checkoutInstance]);

  useEffect(() => {
    if (!saleWidget) {
      return;
    }

    saleWidget.addListener(
      checkout.SaleEventType.SUCCESS,
      (data: checkout.SaleSuccess) => {
        console.log('success', data);

        if (data.transactionId) {
          const hash = data.transactions.pop()?.hash;

          setAlert({
            severity: 'success',
            message: (
              <>
                Transaction successful. View it in the {' '}
                <Link href={`https://explorer.testnet.immutable.com/tx/${hash}`}>block explorer</Link>
              </>
            ),
          });
        }
      },
    );
    saleWidget.addListener(
      checkout.SaleEventType.FAILURE,
      (data: checkout.SaleFailed) => {
        console.log('failure', data);

        setAlert({
          severity: 'error',
          message: (data.error?.data as any)?.error?.reason || 'An error occurred',
        });
      },
    );
    saleWidget.addListener(
      checkout.SaleEventType.TRANSACTION_SUCCESS,
      (data: checkout.SaleTransactionSuccess) => {
        console.log('tx success', data);
      },
    );

    saleWidget.addListener(checkout.SaleEventType.CLOSE_WIDGET, () => {
      setSaleOpen(false);
      saleWidget.unmount();
    });
  }, [saleWidget]);

  useEffect(() => {
    if (passportInstance && login) {
      passportInstance.loginCallback();
    }
  }, [login, passportInstance]);

  const handleSaleClick = (items: checkout.SaleItem[]) => {
    if (!saleWidget) {
      return;
    }

    const isFreeMint = items.every((item) => {
      const product = products.find((product) => product.product_id === item.productId);

      return product?.pricing.every((pricing) => pricing.amount === 0);
    });

    setSaleOpen(true);

    setTimeout(() => {
      saleWidget.mount('sale-widget', {
        environmentId,
        collectionName,
        items,
        excludePaymentTypes: isFreeMint ? [
          checkout.SalePaymentTypes.DEBIT,
          checkout.SalePaymentTypes.CREDIT,
        ] : [],
      });
    }, 500);
  }

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Simple NFT store
      </Typography>

      {alert && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {products.length > 0 ? products.map((product) => (
        <Card key={product.product_id}>
          <CardMedia
            sx={{ height: 240 }}
            image={product.image}
            title={product.name}
          />
          <CardContent>
            <Stack direction="row" alignItems="center" alignContent="center" spacing={1} sx={{ mb: 1 }}>
              <Typography gutterBottom variant="h5" component="div">
                {product.name}
              </Typography>
              <Chip label="Free mint!" color="default" sx={{ mt: 1 }}/>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {product.description}
            </Typography>
            {product.pricing[0].amount > 0 ?? (
              <Typography variant="body1" sx={{ mt: 1 }}>
                ${product.pricing[0].amount} ${product.pricing[0].currency}
              </Typography>
            )}
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => {
              handleSaleClick([{
                productId: product.product_id,
                qty: 1,
                name: product.name,
                description: product.description,
                image: product.image,
              }]);
            }}>
              {product.pricing[0].amount > 0 ? 'Buy now' : 'Mint for free'}
            </Button>
          </CardActions>
        </Card>
      )) : (
        <Typography variant="body1" component="p">
          Loading products...
        </Typography>
      )}

      <Modal open={saleOpen} onClose={() => setSaleOpen(false)}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}>
          <div id="sale-widget"/>
        </Box>
      </Modal>
    </>
  )
}
