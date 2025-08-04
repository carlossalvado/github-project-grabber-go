import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const SinglePlanCard = ({ plan, onSelectPlan }) => {
  return (
    <Card className={`flex flex-col ${plan.highlight ? 'border-pink-500' : 'border-gray-700'} bg-gray-800 text-white`}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{plan.name}</span>
          {plan.highlight && <Badge className="bg-pink-500">Mais Popular</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-4xl font-bold mb-4">
          R$ {plan.price} <span className="text-lg font-normal text-gray-400">/{plan.interval}</span>
        </p>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="w-4 h-4 mr-2 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-pink-600 hover:bg-pink-700"
          disabled={!plan.id}
          onClick={() => {
            // Implement plan selection logic here
            console.log('Plan selected:', plan.id);
          }}
        >
          Assinar Agora
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SinglePlanCard;